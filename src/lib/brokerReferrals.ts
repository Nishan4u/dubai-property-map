import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notify";
import { sendPushToUser } from "@/lib/webPush";

// Deliberately a separate file/module from src/lib/referrals.ts, which is
// an unrelated internal-DPM-staff commission-tracking system (staff earn
// commission on ANY paid signup). This is a different concept: a broker
// or salesperson earns cashback specifically for recruiting another
// broker or salesperson. All tables here are prefixed broker_referral_*
// to keep the two systems from ever colliding.

type AccountType = "broker" | "salesperson";
type Admin = ReturnType<typeof createAdminClient>;

async function notifyAccount(admin: Admin, accountType: AccountType, accountId: string, message: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq(`${accountType}_id`, accountId)
    .maybeSingle();
  if (profile) {
    await notifyUser(profile.id, message, undefined, admin);
    await sendPushToUser(profile.id, { title: "Dubai Property Map", body: message });
  }
}

async function getSettings(admin: Admin) {
  const { data } = await admin.from("broker_referral_settings").select("*").eq("id", true).single();
  return data;
}

async function isEmailVerified(admin: Admin, accountType: AccountType, accountId: string): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq(`${accountType}_id`, accountId)
    .maybeSingle();
  if (!profile) return false;
  const { data } = await admin.auth.admin.getUserById(profile.id);
  return !!data.user?.email_confirmed_at;
}

// Called at Stripe-checkout-session-creation time. Returns eligibility +
// the discount to apply, or null for the common case (not a referred
// first-time subscriber) -- checkout proceeds exactly as it does today
// with zero behavior change for anyone who wasn't referred.
export async function applyReferralDiscountIfEligible(
  accountType: AccountType,
  accountId: string,
  planKey: string
): Promise<{ signupId: string; discountPercent: number; firstSubscriptionOnly: boolean } | null> {
  const admin = createAdminClient();
  const settings = await getSettings(admin);
  if (!settings?.program_enabled || !settings.discount_enabled) return null;
  if (settings.discount_eligible_plan_keys?.length && !settings.discount_eligible_plan_keys.includes(planKey)) {
    return null;
  }

  const { data: signup } = await admin
    .from("broker_referral_signups")
    .select("id")
    .eq(`referee_${accountType}_id`, accountId)
    .eq("status", "pending_subscription")
    .maybeSingle();
  if (!signup) return null;

  return {
    signupId: signup.id,
    discountPercent: Number(settings.discount_percent),
    firstSubscriptionOnly: settings.discount_first_subscription_only,
  };
}

// Referrer's cashback + the referee's own discount-consumption record.
// Only fires once, guarded by the unique index on
// broker_referral_wallet_transactions(referral_signup_id) where
// type = 'cashback_earned' -- safe to call repeatedly (Stripe webhook
// retries, or the verify-email retry path landing after this already ran).
async function finalizeCashback(admin: Admin, signupId: string) {
  const { data: signup } = await admin.from("broker_referral_signups").select("*").eq("id", signupId).maybeSingle();
  if (!signup || signup.status === "completed" || signup.status === "disqualified" || signup.status === "expired") return;

  const settings = await getSettings(admin);
  if (!settings?.program_enabled || !settings.cashback_enabled) {
    await admin.from("broker_referral_signups").update({ status: "completed", activated_at: signup.activated_at ?? new Date().toISOString() }).eq("id", signupId);
    return;
  }
  if (!settings.cashback_eligible_account_types?.includes(signup.referrer_account_type)) {
    await admin.from("broker_referral_signups").update({ status: "completed", activated_at: signup.activated_at ?? new Date().toISOString() }).eq("id", signupId);
    return;
  }
  if (
    settings.cashback_min_subscription_amount_aed != null &&
    Number(signup.subscription_amount_aed ?? 0) < Number(settings.cashback_min_subscription_amount_aed)
  ) {
    await admin.from("broker_referral_signups").update({ status: "completed", activated_at: signup.activated_at ?? new Date().toISOString() }).eq("id", signupId);
    return;
  }

  const referrerType = signup.referrer_account_type as AccountType;
  const referrerId = referrerType === "broker" ? signup.referrer_broker_id : signup.referrer_salesperson_id;
  const { data: wallet } = await admin
    .from("broker_referral_wallets")
    .select("id, balance_aed, total_earned_aed")
    .eq(`${referrerType}_id`, referrerId)
    .maybeSingle();
  if (!wallet) return;

  const cashbackAmount = Number(settings.cashback_amount_aed);

  const { data: inserted } = await admin
    .from("broker_referral_wallet_transactions")
    .upsert(
      {
        wallet_id: wallet.id,
        type: "cashback_earned",
        amount_aed: cashbackAmount,
        referral_signup_id: signupId,
        related_payment_type: signup.payment_source,
        plan_key: signup.plan_key,
      },
      { onConflict: "referral_signup_id", ignoreDuplicates: true }
    )
    .select("id")
    .maybeSingle();

  if (!inserted) {
    // Already credited by an earlier call (webhook retry) -- still make
    // sure the signup row reflects completion in case that update didn't
    // land the first time.
    await admin
      .from("broker_referral_signups")
      .update({ status: "completed", activated_at: signup.activated_at ?? new Date().toISOString() })
      .eq("id", signupId);
    return;
  }

  await admin
    .from("broker_referral_wallets")
    .update({
      balance_aed: Number(wallet.balance_aed) + cashbackAmount,
      total_earned_aed: Number(wallet.total_earned_aed) + cashbackAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id);

  await admin
    .from("broker_referral_signups")
    .update({
      status: "completed",
      activated_at: signup.activated_at ?? new Date().toISOString(),
      cashback_amount_aed: cashbackAmount,
      cashback_credited_at: new Date().toISOString(),
    })
    .eq("id", signupId);

  await notifyAccount(
    admin,
    referrerType,
    referrerId,
    `You earned AED ${cashbackAmount.toLocaleString()} referral cashback -- someone you referred just subscribed!`
  );
}

// Called from the Stripe webhook (checkout.session.completed) and the
// admin bank-transfer-approve route, right after the account's own
// subscription_status is set to 'active'. Records the payment against the
// signup row and either finalizes cashback immediately (referee's email
// already verified) or parks it in 'paid_awaiting_activation' for the
// verify-email retry hook to pick up later.
export async function recordReferralPaymentSuccess(input: {
  accountType: AccountType;
  accountId: string;
  signupId?: string | null; // known directly from Stripe checkout metadata when present
  paymentSource: "stripe" | "bank_transfer" | "network_international";
  paymentReference: string;
  subscriptionAmountAed: number;
  planKey: string;
  discountPercentApplied?: number | null;
}) {
  const admin = createAdminClient();

  let signupId = input.signupId ?? null;
  if (!signupId) {
    const { data: signup } = await admin
      .from("broker_referral_signups")
      .select("id")
      .eq(`referee_${input.accountType}_id`, input.accountId)
      .in("status", ["pending_subscription", "paid_awaiting_activation"])
      .maybeSingle();
    signupId = signup?.id ?? null;
  }
  if (!signupId) return; // not a referred account -- nothing to do

  const discountAmount =
    input.discountPercentApplied != null ? (input.subscriptionAmountAed * input.discountPercentApplied) / 100 : null;

  await admin
    .from("broker_referral_signups")
    .update({
      payment_source: input.paymentSource,
      payment_reference: input.paymentReference,
      subscription_amount_aed: input.subscriptionAmountAed,
      plan_key: input.planKey,
      discount_percent_applied: input.discountPercentApplied ?? null,
      discount_amount_aed: discountAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", signupId);

  if (await isEmailVerified(admin, input.accountType, input.accountId)) {
    await finalizeCashback(admin, signupId);
  } else {
    await admin.from("broker_referral_signups").update({ status: "paid_awaiting_activation" }).eq("id", signupId);
  }
}

// Called from /api/auth/verify-email/confirm/route.ts right after a user's
// email is flipped to confirmed -- covers the race where payment completed
// before verification did (neither broker nor salesperson dashboards
// currently gate access on email_confirmed_at, so this order is possible).
export async function tryFinalizeReferralCashback(accountType: AccountType, accountId: string) {
  const admin = createAdminClient();
  const { data: signup } = await admin
    .from("broker_referral_signups")
    .select("id")
    .eq(`referee_${accountType}_id`, accountId)
    .eq("status", "paid_awaiting_activation")
    .maybeSingle();
  if (!signup) return;
  await finalizeCashback(admin, signup.id);
}

// Called from the Stripe webhook's subscription cancellation branch for a
// referee whose reward hasn't been credited yet -- nothing to reverse,
// just marks the referral dead so a later resubscribe (if
// allow_reward_on_resubscription is off) can't retrigger it.
export async function disqualifySignupOnCancellation(accountType: AccountType, accountId: string, reason: string) {
  const admin = createAdminClient();
  await admin
    .from("broker_referral_signups")
    .update({ status: "disqualified", disqualified_reason: reason, updated_at: new Date().toISOString() })
    .eq(`referee_${accountType}_id`, accountId)
    .in("status", ["pending_subscription", "paid_awaiting_activation"]);
}

// Called from the Stripe webhook for a referee whose subscription is
// cancelled/refunded AFTER cashback was already credited to the referrer's
// wallet -- claws it back automatically, clamped to whatever balance is
// still there (never forces a wallet negative; a shortfall from an
// already-spent balance is logged in the transaction note for admin
// visibility, not force-collected).
export async function clawbackReferralCashback(accountType: AccountType, accountId: string, reason: string) {
  const admin = createAdminClient();
  const { data: signup } = await admin
    .from("broker_referral_signups")
    .select("*")
    .eq(`referee_${accountType}_id`, accountId)
    .eq("status", "completed")
    .not("cashback_credited_at", "is", null)
    .is("cashback_reversed_at", null)
    .maybeSingle();
  if (!signup || !signup.cashback_amount_aed) return;

  const referrerType = signup.referrer_account_type as AccountType;
  const referrerId = referrerType === "broker" ? signup.referrer_broker_id : signup.referrer_salesperson_id;
  const { data: wallet } = await admin
    .from("broker_referral_wallets")
    .select("id, balance_aed, total_earned_aed")
    .eq(`${referrerType}_id`, referrerId)
    .maybeSingle();
  if (!wallet) return;

  const clawbackAmount = Math.min(Number(signup.cashback_amount_aed), Number(wallet.balance_aed));
  const shortfall = Number(signup.cashback_amount_aed) - clawbackAmount;

  await admin.from("broker_referral_wallet_transactions").insert({
    wallet_id: wallet.id,
    type: "clawback",
    amount_aed: clawbackAmount,
    referral_signup_id: signup.id,
    note: shortfall > 0 ? `${reason} -- AED ${shortfall.toFixed(2)} of this reward was already spent and could not be recovered.` : reason,
  });

  await admin
    .from("broker_referral_wallets")
    .update({ balance_aed: Number(wallet.balance_aed) - clawbackAmount, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);

  await admin.from("broker_referral_signups").update({ cashback_reversed_at: new Date().toISOString() }).eq("id", signup.id);

  await notifyAccount(
    admin,
    referrerType,
    referrerId,
    `AED ${clawbackAmount.toLocaleString()} referral cashback was reversed from your wallet -- the referred subscription was cancelled or refunded.`
  );
}
