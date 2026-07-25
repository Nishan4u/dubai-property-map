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
