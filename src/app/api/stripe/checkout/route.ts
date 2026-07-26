import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { plan } = await request.json();

  const supabase = await createClient();
  const { data: planRow } = await supabase
    .from("subscription_plans")
    .select("stripe_price_id, status, online_payment_enabled, renewal_allowed_when_inactive")
    .eq("key", plan)
    .maybeSingle();

  if (!planRow) {
    return NextResponse.json({ error: "This plan is no longer available." }, { status: 400 });
  }
  if (!planRow.online_payment_enabled) {
    return NextResponse.json(
      { error: "Online payment isn't enabled for this plan — use Bank Transfer instead." },
      { status: 400 }
    );
  }

  const priceId = planRow?.stripe_price_id;
  if (!priceId) {
    return NextResponse.json(
      {
        error: `No Stripe price configured for the "${plan}" plan yet. Set its Stripe Price ID in Admin → Packages & Plans.`,
      },
      { status: 400 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("developer_id, developers(stripe_customer_id, plan_tier, subscription_status)")
    .eq("id", user.id)
    .single();

  if (!profile?.developer_id) {
    return NextResponse.json({ error: "No developer account found." }, { status: 400 });
  }

  if (planRow.status !== "active") {
    const developerRow = Array.isArray(profile.developers) ? profile.developers[0] : profile.developers;
    // A disabled plan blocks new signups always. Whether an existing
    // subscriber can still renew the exact same plan is a separate,
    // admin-controlled decision.
    const isExistingRenewal =
      planRow.renewal_allowed_when_inactive &&
      developerRow?.plan_tier === plan &&
      developerRow?.subscription_status === "active";
    if (!isExistingRenewal) {
      return NextResponse.json({ error: "This plan is no longer available." }, { status: 400 });
    }
  }

  const existingCustomerId = Array.isArray(profile.developers)
    ? profile.developers[0]?.stripe_customer_id
    : (profile.developers as { stripe_customer_id: string | null } | null)?.stripe_customer_id;

  try {
    const stripe = getStripe();
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: existingCustomerId ?? undefined,
      customer_email: existingCustomerId ? undefined : user.email,
      client_reference_id: profile.developer_id,
      metadata: { developer_id: profile.developer_id, plan },
      success_url: `${origin}/dashboard/packages?checkout=success`,
      cancel_url: `${origin}/dashboard/packages?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe error" },
      { status: 500 }
    );
  }
}
