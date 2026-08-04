import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notify";
import { sendPushToUser } from "@/lib/webPush";

type AccountType = "developer" | "broker" | "salesperson";

// This file only ever runs server-side (it already imports createAdminClient,
// the service-role client, which would leak into the browser if this were
// reachable from client code) -- safe to also call the Node-only web-push
// library here, unlike src/lib/notify.ts itself, which is called directly
// from several client components and must stay free of server-only imports.
async function notifyStaff(staffId: string, message: string) {
  const admin = createAdminClient();
  const { data: staffProfile } = await admin.from("profiles").select("id").eq("staff_id", staffId).maybeSingle();
  if (staffProfile) {
    await notifyUser(staffProfile.id, message, undefined, admin);
    await sendPushToUser(staffProfile.id, { title: "Dubai Property Map", body: message });
  }
}

// Idempotent: the first successful paid subscription creates the
// attribution row; every later renewal for the same account reuses it
// automatically (the unique partial indexes on staff_referrals guarantee
// one staff member per customer, forever — no re-entry of the code, and
// admin can only repoint it, never duplicate it).
export async function attributeReferral(
  referralCode: string | null | undefined,
  accountType: AccountType,
  accountId: string
): Promise<string | null> {
  if (!referralCode?.trim()) return null;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("staff_referrals")
    .select("id, staff_id")
    .eq(`${accountType}_id`, accountId)
    .maybeSingle();
  if (existing) return existing.staff_id;

  const { data: staff } = await admin
    .from("staff")
    .select("id, status")
    .ilike("referral_code", referralCode.trim())
    .maybeSingle();
  if (!staff || staff.status !== "active") return null;

  const { data: created } = await admin
    .from("staff_referrals")
    .insert({
      staff_id: staff.id,
      referral_code: referralCode.trim(),
      account_type: accountType,
      [`${accountType}_id`]: accountId,
    })
    .select("id, staff_id")
    .maybeSingle();

  if (created) {
    await notifyStaff(created.staff_id, `New referral! A ${accountType} account just subscribed using your referral code.`);
  }

  return created?.staff_id ?? null;
}

// Commission is generated per eligible successful paid month, keyed by a
// unique payment/transaction ID so the same invoice or bank transfer can
// never be commissioned twice — the ON CONFLICT here is what makes
// re-running a webhook event (Stripe retries) safe.
export async function recordCommission(input: {
  accountType: AccountType;
  accountId: string;
  paymentId: string;
  paymentSource: "stripe" | "bank_transfer" | "network_international";
  subscriptionAmount: number;
  paidAt?: Date;
}) {
  const admin = createAdminClient();

  const { data: referral } = await admin
    .from("staff_referrals")
    .select("id, staff_id")
    .eq(`${input.accountType}_id`, input.accountId)
    .maybeSingle();
  if (!referral) return;

  const { data: staff } = await admin.from("staff").select("commission_type, commission_rate, status").eq("id", referral.staff_id).maybeSingle();
  if (!staff || staff.status !== "active") return;

  const commissionAmount =
    staff.commission_type === "flat" ? Number(staff.commission_rate) : (input.subscriptionAmount * Number(staff.commission_rate)) / 100;

  const paidAt = input.paidAt ?? new Date();

  const { data: inserted } = await admin
    .from("staff_commissions")
    .upsert(
      {
        staff_id: referral.staff_id,
        referral_id: referral.id,
        account_type: input.accountType,
        payment_id: input.paymentId,
        payment_source: input.paymentSource,
        subscription_amount: input.subscriptionAmount,
        commission_amount: commissionAmount,
        period_year: paidAt.getUTCFullYear(),
        period_month: paidAt.getUTCMonth() + 1,
      },
      { onConflict: "payment_id", ignoreDuplicates: true }
    )
    .select("id")
    .maybeSingle();

  if (inserted) {
    await notifyStaff(referral.staff_id, `You earned AED ${commissionAmount.toLocaleString()} commission from a referred ${input.accountType}.`);
  }
}
