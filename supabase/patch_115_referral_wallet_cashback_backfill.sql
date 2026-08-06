-- One-off backfill for a real bug (fixed in src/lib/brokerReferrals.ts):
-- finalizeCashback() credited a referrer's wallet via a Postgres upsert
-- targeting broker_referral_wallet_transactions(referral_signup_id), but
-- that column's uniqueness is enforced by a *partial* index (patch_95,
-- ...where type = 'cashback_earned'), which PostgREST's upsert onConflict
-- can't target. Every call silently failed (data came back null, the
-- error was never read), so broker_referral_signups.status flipped to
-- 'completed' without ever crediting the referrer's wallet.
--
-- This backfills the one live signup that fell through before the code
-- fix shipped -- idempotent (checks for an existing cashback_earned
-- transaction and a set cashback_credited_at before doing anything), safe
-- to run even if it's already been credited by some other means.
do $$
declare
  v_signup broker_referral_signups%rowtype;
  v_wallet_id uuid;
  v_wallet_balance numeric(10, 2);
  v_wallet_total_earned numeric(10, 2);
  v_amount numeric(10, 2);
begin
  select * into v_signup from broker_referral_signups
    where id = '880f6422-a90f-425d-8242-293eceedd38b';

  if v_signup.id is null then
    return;
  end if;
  if v_signup.cashback_credited_at is not null then
    return;
  end if;
  if exists (
    select 1 from broker_referral_wallet_transactions
    where referral_signup_id = v_signup.id and type = 'cashback_earned'
  ) then
    return;
  end if;

  select id, balance_aed, total_earned_aed into v_wallet_id, v_wallet_balance, v_wallet_total_earned
    from broker_referral_wallets
    where broker_id = v_signup.referrer_broker_id;

  if v_wallet_id is null then
    return;
  end if;

  select cashback_amount_aed into v_amount from broker_referral_settings where id = true;
  if v_amount is null then
    v_amount := 30;
  end if;

  insert into broker_referral_wallet_transactions (wallet_id, type, amount_aed, referral_signup_id, related_payment_type, plan_key)
  values (v_wallet_id, 'cashback_earned', v_amount, v_signup.id, v_signup.payment_source, v_signup.plan_key);

  update broker_referral_wallets
    set balance_aed = v_wallet_balance + v_amount,
        total_earned_aed = v_wallet_total_earned + v_amount,
        updated_at = now()
    where id = v_wallet_id;

  update broker_referral_signups
    set cashback_amount_aed = v_amount, cashback_credited_at = now()
    where id = v_signup.id;
end $$;
