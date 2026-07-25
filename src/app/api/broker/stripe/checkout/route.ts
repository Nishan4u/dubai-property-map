import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { plan } = await request.json();

  const supabase = await createClient();
  const { data: planRow } = await supabase
    .from("subscription_plans")
    .select("stripe_price_id")
    .eq("key", plan)
    .eq("plan_type", "broker")
    .maybeSingle();

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
    .select("broker_id, brokers!profiles_broker_id_fkey(stripe_customer_id)")
    .eq("id", user.id)
    .single();

  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 400 });
  }

  const brokerRel = profile.brokers as { stripe_customer_id: string | null } | { stripe_customer_id: string | null }[] | null;
  const existingCustomerId = Array.isArray(brokerRel) ? brokerRel[0]?.stripe_customer_id : brokerRel?.stripe_customer_id;

  try {
    const stripe = getStripe();
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: existingCustomerId ?? undefined,
      customer_email: existingCustomerId ? undefined : user.email,
      client_reference_id: profile.broker_id,
      metadata: { kind: "broker_subscription", broker_id: profile.broker_id, plan },
      success_url: `${origin}/broker/subscription?checkout=success`,
      cancel_url: `${origin}/broker/subscription?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe error" },
      { status: 500 }
    );
  }
}
