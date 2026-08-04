import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNetworkInternationalOrder } from "@/lib/networkInternational";
import { applyReferralDiscountIfEligible } from "@/lib/brokerReferrals";

// Mirrors /api/broker/network-checkout exactly for the salesperson
// portal -- see that route's comments for the price_aed/promo-pricing
// scope notes, which apply identically here.
export async function POST(request: NextRequest) {
  const { plan, referralCode } = await request.json();

  const supabase = await createClient();
  const { data: planRow } = await supabase
    .from("subscription_plans")
    .select("price_aed, duration_days, status, online_payment_enabled, renewal_allowed_when_inactive")
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
    .select("salesperson_id, salespersons!profiles_salesperson_id_fkey(plan_key, subscription_status)")
    .eq("id", user.id)
    .single();

  if (!profile?.salesperson_id) {
    return NextResponse.json({ error: "No salesperson account found." }, { status: 400 });
  }

  if (planRow.status !== "active") {
    const salespersonCheck = Array.isArray(profile.salespersons) ? profile.salespersons[0] : profile.salespersons;
    const isExistingRenewal =
      planRow.renewal_allowed_when_inactive &&
      salespersonCheck?.plan_key === plan &&
      salespersonCheck?.subscription_status === "active";
    if (!isExistingRenewal) {
      return NextResponse.json({ error: "This plan is no longer available." }, { status: 400 });
    }
  }

  const eligibleReferral = await applyReferralDiscountIfEligible("salesperson", profile.salesperson_id, plan);
  const amountAed = eligibleReferral ? planRow.price_aed * (1 - eligibleReferral.discountPercent / 100) : planRow.price_aed;

  const origin = request.headers.get("origin") ?? "http://localhost:3000";
  const result = await createNetworkInternationalOrder({
    amountAed,
    email: user.email ?? "",
    redirectUrl: `${origin}/salesperson/subscription?checkout=success`,
    cancelUrl: `${origin}/salesperson/subscription?checkout=cancelled`,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const admin = createAdminClient();
  await admin.from("network_international_orders").insert({
    order_reference: result.orderReference,
    account_type: "salesperson",
    salesperson_id: profile.salesperson_id,
    plan_key: plan,
    amount_aed: amountAed,
    referral_code: referralCode?.trim() || null,
    broker_referral_signup_id: eligibleReferral?.signupId ?? null,
    broker_referral_discount_percent: eligibleReferral?.discountPercent ?? null,
  });

  return NextResponse.json({ url: result.paymentUrl });
}
