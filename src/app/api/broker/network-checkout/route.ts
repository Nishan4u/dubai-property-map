import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNetworkInternationalOrder } from "@/lib/networkInternational";
import { applyReferralDiscountIfEligible } from "@/lib/brokerReferrals";

// Mirrors /api/broker/stripe/checkout's plan lookup/validation exactly,
// but creates a one-time Network International order instead of a Stripe
// subscription session -- price_aed (not stripe_price_id) is the amount
// source, since N-Genius has no concept of a pre-configured recurring
// price object. Promo pricing (promo_stripe_price_id) has no AED
// equivalent anywhere in this schema, so it's deliberately not applied
// here -- a real, honest scope trim, not an oversight.
export async function POST(request: NextRequest) {
  const { plan, referralCode } = await request.json();

  const supabase = await createClient();
  const { data: planRow } = await supabase
    .from("subscription_plans")
    .select("price_aed, renewal_price_aed, duration_days, status, online_payment_enabled, renewal_allowed_when_inactive")
    .eq("key", plan)
    .eq("plan_type", "broker")
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
  if (!planRow.price_aed) {
    return NextResponse.json(
      { error: `No AED price configured for the "${plan}" plan yet. Set it in Admin → Packages & Plans.` },
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
    .select("broker_id, brokers!profiles_broker_id_fkey(plan_key, subscription_status)")
    .eq("id", user.id)
    .single();

  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 400 });
  }

  const brokerCheck = Array.isArray(profile.brokers) ? profile.brokers[0] : profile.brokers;
  const isRenewal = brokerCheck?.plan_key === plan && brokerCheck?.subscription_status === "active";

  if (planRow.status !== "active") {
    const isExistingRenewal = planRow.renewal_allowed_when_inactive && isRenewal;
    if (!isExistingRenewal) {
      return NextResponse.json({ error: "This plan is no longer available." }, { status: 400 });
    }
  }

  const basePrice = isRenewal && planRow.renewal_price_aed != null ? planRow.renewal_price_aed : planRow.price_aed;
  const eligibleReferral = await applyReferralDiscountIfEligible("broker", profile.broker_id, plan, referralCode);
  const amountAed = eligibleReferral ? basePrice * (1 - eligibleReferral.discountPercent / 100) : basePrice;

  const origin = request.headers.get("origin") ?? "http://localhost:3000";
  const result = await createNetworkInternationalOrder({
    amountAed,
    email: user.email ?? "",
    redirectUrl: `${origin}/broker/subscription?checkout=success`,
    cancelUrl: `${origin}/broker/subscription?checkout=cancelled`,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const admin = createAdminClient();
  await admin.from("network_international_orders").insert({
    order_reference: result.orderReference,
    account_type: "broker",
    broker_id: profile.broker_id,
    plan_key: plan,
    amount_aed: amountAed,
    referral_code: referralCode?.trim() || null,
    broker_referral_signup_id: eligibleReferral?.signupId ?? null,
    broker_referral_discount_percent: eligibleReferral?.discountPercent ?? null,
  });

  return NextResponse.json({ url: result.paymentUrl });
}
