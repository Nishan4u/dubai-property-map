import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { attributeReferral, recordCommission } from "@/lib/referrals";
import { recordReferralPaymentSuccess } from "@/lib/brokerReferrals";

const SUCCESS_STATES = new Set(["PURCHASED", "CAPTURED"]);

// N-Genius Online webhook payloads are not signed (confirmed against
// docs.ngenius-payments.com's own "Consuming Web Hooks" page) -- the best
// available verification is an optional shared-secret custom header
// configured in the N-Genius portal's webhook settings (Settings ->
// Integrations -> Webhooks -> "Header Key"/"Header Value"), checked here
// against NETWORK_INTERNATIONAL_WEBHOOK_SECRET. A known, accepted
// limitation of the platform itself, not something this route can fix on
// its own -- documented rather than silently assumed secure, same as the
// email-keyed lockout tradeoff already called out in src/lib/authLockout.ts.
//
// Mirrors src/app/api/stripe/webhook/route.ts's broker_subscription/
// salesperson_subscription activation shape, adapted for a one-time
// order rather than a Stripe subscription object -- see patch_118's own
// comment for why this doesn't attempt Stripe-style auto-renewal.
export async function POST(request: NextRequest) {
  const configuredSecret = process.env.NETWORK_INTERNATIONAL_WEBHOOK_SECRET;
  if (configuredSecret) {
    const providedSecret = request.headers.get("x-webhook-secret");
    if (providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => null);
  const eventName = body?.eventName as string | undefined;
  const orderReference = body?.order?.reference as string | undefined;

  if (!orderReference || !eventName || !SUCCESS_STATES.has(eventName)) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const { data: order } = await admin.from("network_international_orders").select("*").eq("order_reference", orderReference).maybeSingle();

  if (!order || order.status === "paid") {
    return NextResponse.json({ received: true });
  }

  const { data: planRow } = await admin
    .from("subscription_plans")
    .select("duration_days")
    .eq("key", order.plan_key)
    .eq("plan_type", order.account_type)
    .maybeSingle();

  let expiresAt: string | null = null;
  if (planRow?.duration_days) {
    const expires = new Date();
    expires.setDate(expires.getDate() + planRow.duration_days);
    expiresAt = expires.toISOString().slice(0, 10);
  }

  await admin.from("network_international_orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);

  const table = order.account_type === "broker" ? "brokers" : "salespersons";
  const accountId = order.account_type === "broker" ? order.broker_id : order.salesperson_id;
  if (!accountId) {
    return NextResponse.json({ received: true });
  }

  await admin
    .from(table)
    .update({
      plan_key: order.plan_key,
      subscription_status: "active",
      subscription_expires_at: expiresAt,
      last_reminder_sent_days: null,
      payment_type: "network_international",
    })
    .eq("id", accountId);

  await attributeReferral(order.referral_code, order.account_type, accountId);
  await recordCommission({
    accountType: order.account_type,
    accountId,
    paymentId: orderReference,
    paymentSource: "network_international",
    subscriptionAmount: order.amount_aed,
  });

  if (order.broker_referral_signup_id) {
    await recordReferralPaymentSuccess({
      accountType: order.account_type,
      accountId,
      signupId: order.broker_referral_signup_id,
      paymentSource: "network_international",
      paymentReference: orderReference,
      subscriptionAmountAed: order.amount_aed,
      planKey: order.plan_key,
      discountPercentApplied: order.broker_referral_discount_percent,
    });
  }

  const { data: account } = await admin.from(table).select("full_name, email").eq("id", accountId).single();
  if (account?.email) {
    await sendEmail({
      category: "subscription_activated",
      to: account.email,
      subject: "Your Dubai Property Map subscription is active",
      html: `<p>Hi ${account.full_name},</p><p>Your <strong>${order.plan_key}</strong> subscription is now active${expiresAt ? ` and renews on ${expiresAt}` : ""}.</p>`,
    });
  }

  return NextResponse.json({ received: true });
}
