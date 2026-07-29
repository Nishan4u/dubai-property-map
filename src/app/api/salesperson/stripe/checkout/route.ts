import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { isPromoLive } from "@/lib/subscriptionStatus";

export async function POST(request: NextRequest) {
  const { plan, referralCode } = await request.json();

  const supabase = await createClient();
  const { data: planRow } = await supabase
    .from("subscription_plans")
    .select(
      "stripe_price_id, status, online_payment_enabled, renewal_allowed_when_inactive, promo_active, promo_ends_at, promo_price_label, promo_stripe_price_id"
    )
    .eq("key", plan)
    .eq("plan_type", "salesperson")
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

  const priceId = isPromoLive(planRow) && planRow.promo_stripe_price_id ? planRow.promo_stripe_price_id : planRow?.stripe_price_id;
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
    .select("salesperson_id, salespersons!profiles_salesperson_id_fkey(stripe_customer_id, plan_key, subscription_status)")
    .eq("id", user.id)
    .single();

  if (!profile?.salesperson_id) {
    return NextResponse.json({ error: "No salesperson account found." }, { status: 400 });
  }

  if (planRow.status !== "active") {
    const spCheck = Array.isArray(profile.salespersons) ? profile.salespersons[0] : profile.salespersons;
    const isExistingRenewal =
      planRow.renewal_allowed_when_inactive &&
      spCheck?.plan_key === plan &&
      spCheck?.subscription_status === "active";
    if (!isExistingRenewal) {
      return NextResponse.json({ error: "This plan is no longer available." }, { status: 400 });
    }
  }

  const spRel = profile.salespersons as
    | { stripe_customer_id: string | null }
    | { stripe_customer_id: string | null }[]
    | null;
  const existingCustomerId = Array.isArray(spRel) ? spRel[0]?.stripe_customer_id : spRel?.stripe_customer_id;

  try {
    const stripe = getStripe();
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: existingCustomerId ?? undefined,
      customer_email: existingCustomerId ? undefined : user.email,
      client_reference_id: profile.salesperson_id,
      metadata: { kind: "salesperson_subscription", salesperson_id: profile.salesperson_id, plan, referral_code: referralCode?.trim() || "" },
      success_url: `${origin}/salesperson/subscription?checkout=success`,
      cancel_url: `${origin}/salesperson/subscription?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe error" },
      { status: 500 }
    );
  }
}
