import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// Flat annual fee, admin-configurable via the existing generic
// platform_settings editor (/admin/settings) -- same pattern as
// /api/developer/feature-project-checkout's flat AED 50 boost: a one-time
// Stripe "payment" checkout, not a real recurring Stripe subscription,
// since the admin can also grant/renew/revoke this by hand with no
// payment at all (see /api/admin/brokers/[id]/verification).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("broker_id").eq("id", user.id).single();
  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 403 });
  }

  const { data: broker } = await supabase
    .from("brokers")
    .select("id, full_name, account_status, stripe_customer_id")
    .eq("id", profile.broker_id)
    .single();
  if (!broker) {
    return NextResponse.json({ error: "Broker not found." }, { status: 404 });
  }
  if (broker.account_status !== "approved") {
    return NextResponse.json({ error: "Your broker account must be approved before verifying." }, { status: 400 });
  }

  const { data: feeSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "broker_verification_fee_aed")
    .maybeSingle();
  const feeAed = Number(feeSetting?.value) || 50;

  try {
    const stripe = getStripe();
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "aed",
            unit_amount: Math.round(feeAed * 100),
            product_data: {
              name: "Verified Broker Membership (1 year)",
              description: "Verified badge, priority placement, and priority search results for 1 year.",
            },
          },
          quantity: 1,
        },
      ],
      customer: broker.stripe_customer_id ?? undefined,
      customer_email: broker.stripe_customer_id ? undefined : user.email,
      client_reference_id: broker.id,
      metadata: {
        kind: "broker_verification",
        broker_id: broker.id,
      },
      success_url: `${origin}/broker/profile?verification_checkout=success`,
      cancel_url: `${origin}/broker/profile?verification_checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe error" },
      { status: 500 }
    );
  }
}
