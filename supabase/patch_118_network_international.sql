-- Network International (N-Genius Online) -- the payment gateway picked
-- alongside Stripe + Bank Transfer (Module 3/15 "Payments"). Real REST
-- API integration, verified against docs.ngenius-payments.com (access-
-- token auth, order creation, webhook payload shape) -- gated behind
-- NETWORK_INTERNATIONAL_API_KEY / NETWORK_INTERNATIONAL_OUTLET_REF, same
-- "not configured" honesty pattern as every other integration this
-- session.
--
-- Unlike Stripe Checkout's `mode: "subscription"`, N-Genius's order API
-- is a one-time-payment primitive with no native recurring-billing
-- concept -- this deliberately doesn't attempt to replicate Stripe's
-- auto-renewal (that would need a separate saved-card/tokenization flow
-- plus a background renewal job, real but meaningfully bigger scope).
-- Each successful payment activates the account for one billing period
-- (subscription_plans.duration_days) -- the same "pay for a period, come
-- back to renew" shape Bank Transfer already has, not a new gap.
create table if not exists network_international_orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  account_type text not null check (account_type in ('broker', 'salesperson')),
  broker_id uuid references brokers(id) on delete cascade,
  salesperson_id uuid references salespersons(id) on delete cascade,
  plan_key text not null,
  amount_aed numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  referral_code text,
  broker_referral_signup_id uuid,
  broker_referral_discount_percent numeric(5, 2),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists network_international_orders_order_reference_idx on network_international_orders(order_reference);

alter table network_international_orders enable row level security;

drop policy if exists "network_international_orders: broker selects own" on network_international_orders;
create policy "network_international_orders: broker selects own" on network_international_orders for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "network_international_orders: salesperson selects own" on network_international_orders;
create policy "network_international_orders: salesperson selects own" on network_international_orders for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "network_international_orders: admin reads all" on network_international_orders;
create policy "network_international_orders: admin reads all" on network_international_orders for select using (is_admin());
-- No insert/update/delete policy for any role -- every write goes through
-- the service-role client (checkout route creates the pending row, the
-- webhook route updates it), same as crm_integration_logs' precedent.

-- Extend the existing payment_type/payment_source check constraints
-- (patch_97's exact pattern -- looks up the actual constraint name from
-- pg_constraint rather than assuming it, so this doesn't fail if
-- Postgres named it differently) to add 'network_international'
-- alongside whatever each already allowed. staff_commissions.payment_source
-- and broker_referral_signups.payment_source are extended too, since
-- recordCommission()/recordReferralPaymentSuccess() (src/lib/referrals.ts,
-- src/lib/brokerReferrals.ts) both write into them and need a real value
-- for a Network International payment, not a misleading 'bank_transfer'.
do $$
declare
  v_conname text;
begin
  select conname into v_conname from pg_constraint
    where conrelid = 'brokers'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%payment_type%';
  if v_conname is not null then
    execute format('alter table brokers drop constraint %I', v_conname);
  end if;
  alter table brokers add constraint brokers_payment_type_check
    check (payment_type in ('stripe', 'bank_transfer', 'admin_free', 'wallet', 'network_international'));

  select conname into v_conname from pg_constraint
    where conrelid = 'salespersons'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%payment_type%';
  if v_conname is not null then
    execute format('alter table salespersons drop constraint %I', v_conname);
  end if;
  alter table salespersons add constraint salespersons_payment_type_check
    check (payment_type in ('stripe', 'bank_transfer', 'admin_free', 'wallet', 'network_international'));

  select conname into v_conname from pg_constraint
    where conrelid = 'staff_commissions'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%payment_source%';
  if v_conname is not null then
    execute format('alter table staff_commissions drop constraint %I', v_conname);
  end if;
  alter table staff_commissions add constraint staff_commissions_payment_source_check
    check (payment_source in ('stripe', 'bank_transfer', 'network_international'));

  select conname into v_conname from pg_constraint
    where conrelid = 'broker_referral_signups'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%payment_source%';
  if v_conname is not null then
    execute format('alter table broker_referral_signups drop constraint %I', v_conname);
  end if;
  alter table broker_referral_signups add constraint broker_referral_signups_payment_source_check
    check (payment_source in ('stripe', 'bank_transfer', 'network_international'));
end;
$$;

notify pgrst, 'reload schema';
