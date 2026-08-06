import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { isPromoLive } from "@/lib/subscriptionStatus";
import { applyReferralDiscountIfEligible } from "@/lib/brokerReferrals";

export async function POST(request: NextRequest) {
  const { plan, referralCode } = await request.json();

  const supabase = await createClient();
  const { data: planRow } = await supabase
    .from("subscription_plans")
    .select(
      "stripe_price_id, status, online_payment_enabled, renewal_allowed_when_inactive, auto_renewal_enabled, promo_active, promo_ends_at, promo_price_label, promo_stripe_price_id"
    )
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
    .select("broker_id, brokers!profiles_broker_id_fkey(stripe_customer_id, plan_key, subscription_status)")
    .eq("id", user.id)
    .single();

  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 400 });
  }

  if (planRow.status !== "active") {
    const brokerCheck = Array.isArray(profile.brokers) ? profile.brokers[0] : profile.brokers;
    const isExistingRenewal =
      planRow.renewal_allowed_when_inactive &&
      brokerCheck?.plan_key === plan &&
      brokerCheck?.subscription_status === "active";
    if (!isExistingRenewal) {
      return NextResponse.json({ error: "This plan is no longer available." }, { status: 400 });
    }
  }

  const brokerRel = profile.brokers as { stripe_customer_id: string | null } | { stripe_customer_id: string | null }[] | null;
  const existingCustomerId = Array.isArray(brokerRel) ? brokerRel[0]?.stripe_customer_id : brokerRel?.stripe_customer_id;

  try {
    const stripe = getStripe();
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    // Broker/Salesperson Referral Program discount -- a distinct concept
    // from the `referral_code` metadata field above (that's the unrelated
    // internal-staff commission system, src/lib/referrals.ts). A coupon is
    // created fresh here rather than reused, since the discount % is
    // admin-configurable at any time and a Stripe Coupon's percent_off is
    // immutable once created.
    const eligibleReferral = await applyReferralDiscountIfEligible("broker", profile.broker_id, plan, referralCode);
    let discounts: { coupon: string }[] | undefined;
    if (eligibleReferral) {
      const coupon = await stripe.coupons.create({
        percent_off: eligibleReferral.discountPercent,
        duration: eligibleReferral.firstSubscriptionOnly ? "once" : "forever",
        name: "Referral Discount",
      });
      discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: existingCustomerId ?? undefined,
      customer_email: existingCustomerId ? undefined : user.email,
      client_reference_id: profile.broker_id,
      discounts,
      metadata: {
        kind: "broker_subscription",
        broker_id: profile.broker_id,
        plan,
        referral_code: referralCode?.trim() || "",
        broker_referral_signup_id: eligibleReferral?.signupId ?? "",
        broker_referral_discount_percent: eligibleReferral ? String(eligibleReferral.discountPercent) : "",
        // Checkout Sessions' subscription_data has no cancel_at_period_end
        // field -- that only exists on an already-created subscription, so
        // this travels via metadata for the webhook to act on after the
        // subscription exists (stripe.subscriptions.update(...)).
        auto_renewal_enabled: String(planRow.auto_renewal_enabled !== false),
      },
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
