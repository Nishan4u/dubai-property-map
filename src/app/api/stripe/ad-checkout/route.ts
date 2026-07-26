import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const AD_PLACEMENT_PRICE_AED = 500;
const AD_PLACEMENT_DAYS = 15;

export async function POST(request: NextRequest) {
  const { title, placementType, targetUrl, projectId, communityId } = await request.json();

  if (!title?.trim() || !placementType) {
    return NextResponse.json({ error: "Title and placement type are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("developer_id, developers(stripe_customer_id)")
    .eq("id", user.id)
    .single();

  if (!profile?.developer_id) {
    return NextResponse.json({ error: "No developer account found." }, { status: 400 });
  }

  // Feature-limit enforcement (not just pricing-card text): a plan's
  // max_featured_pins / homepage_banner_allowed actually gate whether this
  // checkout is even created, so a paid slot can't be bought past the
  // limit — checked here (server-side) rather than trusting the client.
  if (placementType === "sponsored_pin" || placementType === "homepage_banner") {
    const { data: developerRow } = await supabase
      .from("developers")
      .select("plan_tier, subscription_status, is_complimentary")
      .eq("id", profile.developer_id)
      .single();

    // Same rule as the listing-limit trigger: an expired/cancelled
    // subscription falls back to the free plan's limits rather than
    // keeping whatever paid plan_tier it was last on.
    const effectivePlanKey =
      developerRow?.subscription_status === "active" || developerRow?.is_complimentary
        ? developerRow.plan_tier
        : "free";

    const { data: planRow } = await supabase
      .from("subscription_plans")
      .select("feature_limits")
      .eq("key", effectivePlanKey ?? "free")
      .maybeSingle();

    const limits = planRow?.feature_limits as
      | { max_featured_pins?: number | null; homepage_banner_allowed?: boolean }
      | undefined;

    if (placementType === "homepage_banner" && !limits?.homepage_banner_allowed) {
      return NextResponse.json(
        { error: "Your current plan doesn't include the homepage banner placement. Upgrade your plan to unlock it." },
        { status: 403 }
      );
    }

    if (placementType === "sponsored_pin" && typeof limits?.max_featured_pins === "number") {
      const { count } = await supabase
        .from("ad_placements")
        .select("id", { count: "exact", head: true })
        .eq("developer_id", profile.developer_id)
        .eq("placement_type", "sponsored_pin")
        .in("status", ["pending", "active"]);

      if ((count ?? 0) >= limits.max_featured_pins) {
        return NextResponse.json(
          {
            error: `Featured pin limit reached: your current plan allows ${limits.max_featured_pins} sponsored pin(s). Upgrade your plan or wait for an existing one to expire.`,
          },
          { status: 403 }
        );
      }
    }
  }

  const existingCustomerId = Array.isArray(profile.developers)
    ? profile.developers[0]?.stripe_customer_id
    : (profile.developers as { stripe_customer_id: string | null } | null)?.stripe_customer_id;

  try {
    const stripe = getStripe();
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "aed",
            unit_amount: AD_PLACEMENT_PRICE_AED * 100,
            product_data: {
              name: `Ad Placement — ${title}`,
              description: `${AD_PLACEMENT_DAYS}-day placement`,
            },
          },
          quantity: 1,
        },
      ],
      customer: existingCustomerId ?? undefined,
      customer_email: existingCustomerId ? undefined : user.email,
      client_reference_id: profile.developer_id,
      metadata: {
        kind: "ad_placement",
        developer_id: profile.developer_id,
        title,
        placement_type: placementType,
        target_url: targetUrl ?? "",
        project_id: projectId ?? "",
        community_id: communityId ?? "",
      },
      success_url: `${origin}/dashboard/packages?ad_checkout=success`,
      cancel_url: `${origin}/dashboard/packages?ad_checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe error" },
      { status: 500 }
    );
  }
}
