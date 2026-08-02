import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";
import { sendEmail } from "@/lib/email";

// Mirrors src/app/api/broker/wallet/pay/route.ts -- see its header comment.
export async function POST(request: NextRequest) {
  const { plan } = (await request.json()) as { plan?: string };
  if (!plan) {
    return NextResponse.json({ error: "No plan specified." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("salesperson_id").eq("id", user.id).single();
  if (!profile?.salesperson_id) {
    return NextResponse.json({ error: "No salesperson account found." }, { status: 400 });
  }
  const salespersonId = profile.salesperson_id;

  const admin = createAdminClient();

  const { data: planRow } = await admin
    .from("subscription_plans")
    .select("price_aed, duration_days, status")
    .eq("key", plan)
    .eq("plan_type", "salesperson")
    .maybeSingle();
  if (!planRow || planRow.price_aed == null) {
    return NextResponse.json({ error: "This plan isn't available for wallet payment." }, { status: 400 });
  }

  const { data: salesperson } = await admin
    .from("salespersons")
    .select("plan_key, subscription_status, full_name, email")
    .eq("id", salespersonId)
    .single();
  const isRenewal = salesperson?.plan_key === plan;

  if (!isRenewal) {
    if (planRow.status !== "active") {
      return NextResponse.json({ error: "This plan is no longer available." }, { status: 400 });
    }
    const { data: settings } = await admin.from("broker_referral_settings").select("wallet_new_purchase_enabled").eq("id", true).single();
    if (!settings?.wallet_new_purchase_enabled) {
      return NextResponse.json({ error: "Wallet payment is only available for renewals." }, { status: 400 });
    }
  }

  const { data: wallet } = await admin
    .from("broker_referral_wallets")
    .select("id, balance_aed, total_used_aed")
    .eq("salesperson_id", salespersonId)
    .maybeSingle();
  // price_aed already includes VAT (this platform doesn't collect it as a
  // separate line item from subscribers), so wallet payment simply charges
  // it as-is -- no addition on top.
  const priceAed = Number(planRow.price_aed);
  if (!wallet || Number(wallet.balance_aed) < priceAed) {
    return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
  }

  await admin.from("broker_referral_wallet_transactions").insert({
    wallet_id: wallet.id,
    type: isRenewal ? "used_for_renewal" : "used_for_new_subscription",
    amount_aed: priceAed,
    plan_key: plan,
  });
  await admin
    .from("broker_referral_wallets")
    .update({
      balance_aed: Number(wallet.balance_aed) - priceAed,
      total_used_aed: Number(wallet.total_used_aed) + priceAed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id);

  let expiresAt: string | null = null;
  if (planRow.duration_days) {
    const expires = new Date();
    expires.setDate(expires.getDate() + planRow.duration_days);
    expiresAt = expires.toISOString().slice(0, 10);
  }

  const { error } = await admin
    .from("salespersons")
    .update({
      plan_key: plan,
      subscription_status: "active",
      subscription_expires_at: expiresAt,
      last_reminder_sent_days: null,
      payment_type: "wallet",
    })
    .eq("id", salespersonId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (salesperson?.email) {
    await sendEmail({
      category: "subscription_activated",
      to: salesperson.email,
      subject: "Your Dubai Property Map subscription is active",
      html: `<p>Hi ${salesperson.full_name},</p><p>Your <strong>${plan}</strong> subscription is now active${expiresAt ? ` and renews on ${expiresAt}` : ""}, paid from your Referral Wallet balance.</p>`,
    });
  }

  await logAudit(
    "salesperson.wallet_payment",
    "salesperson",
    salespersonId,
    { plan, amount_aed: priceAed },
    { client: admin, actorId: user.id, actorEmail: user.email }
  );

  return NextResponse.json({ ok: true });
}
