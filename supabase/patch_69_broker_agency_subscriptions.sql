-- Broker Agency subscription infrastructure (independent of Broker/
-- Developer billing per spec section 8), plus the AED 100/year pricing
-- lock for Broker/Broker Agency/Salesperson (section 12). Existing
-- developer billing and existing broker-monthly/salesperson-monthly
-- subscribers are left completely alone -- the old plans are marked
-- inactive (so nobody can newly select them) but keep working for anyone
-- already on them via renewal_allowed_when_inactive, exactly the escape
-- hatch this schema already had for retiring a plan safely.

-- ---------- brokerages: allow 'suspended' like brokers/salespersons/developers ----------
-- (patch_60 gave brokerages the same subscription_status set brokers had
-- BEFORE patch_52 added 'suspended' to it -- the admin Suspend action on
-- AccountSubscriptionActions needs this value to exist here too.)
alter table brokerages drop constraint if exists brokerages_subscription_status_check;
alter table brokerages add constraint brokerages_subscription_status_check
  check (subscription_status in ('no_subscription', 'payment_pending', 'active', 'expired', 'cancelled', 'payment_failed', 'suspended'));

-- ---------- subscription_plans: broker_agency as a plan_type + AED 100/yr plans ----------
alter table subscription_plans drop constraint if exists subscription_plans_plan_type_check;
alter table subscription_plans add constraint subscription_plans_plan_type_check
  check (plan_type in ('developer', 'broker', 'salesperson', 'broker_agency'));

insert into subscription_plans (key, name, price_label, features, plan_type, sort_order, description, duration_days) values
  ('broker-yearly', 'Broker Membership', 'AED 100/year', ARRAY[
    'Browse the full Property Map',
    'Submit property requests to developers',
    'Track your requests end to end'
  ], 'broker', 0, 'Annual access for individual and agency-linked brokers.', 365),
  ('salesperson-yearly', 'Salesperson Access', 'AED 100/year', ARRAY[
    'Receive leads from your developer',
    'Manage assigned property requests',
    'Track your own performance'
  ], 'salesperson', 0, 'Annual access for salespersons registered under a developer.', 365),
  ('broker-agency-yearly', 'Broker Agency Membership', 'AED 100/year', ARRAY[
    'Browse the full Property Map',
    'Submit property requests to developers',
    'Manage your agency''s broker roster'
  ], 'broker_agency', 0, 'Annual access for broker agency accounts.', 365)
on conflict (key) do nothing;

update subscription_plans set status = 'inactive', renewal_allowed_when_inactive = true where key in ('broker-monthly', 'salesperson-monthly');

-- ---------- subscription_bank_transfers: broker_agency as a 4th type ----------
alter table subscription_bank_transfers add column if not exists brokerage_id uuid references brokerages(id) on delete cascade;
create index if not exists subscription_bank_transfers_brokerage_id_idx on subscription_bank_transfers(brokerage_id);

alter table subscription_bank_transfers drop constraint if exists subscription_bank_transfers_account_type_check;
alter table subscription_bank_transfers add constraint subscription_bank_transfers_account_type_check
  check (account_type in ('developer', 'broker', 'salesperson', 'broker_agency'));

alter table subscription_bank_transfers drop constraint if exists subscription_bank_transfers_account_match;
alter table subscription_bank_transfers add constraint subscription_bank_transfers_account_match check (
  (account_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null and brokerage_id is null) or
  (account_type = 'broker' and broker_id is not null and developer_id is null and salesperson_id is null and brokerage_id is null) or
  (account_type = 'salesperson' and salesperson_id is not null and developer_id is null and broker_id is null and brokerage_id is null) or
  (account_type = 'broker_agency' and brokerage_id is not null and developer_id is null and broker_id is null and salesperson_id is null)
);

create policy "subscription_bank_transfers: agency reads own" on subscription_bank_transfers
  for select using (brokerage_id = (select broker_agency_id from profiles where id = auth.uid()));

create policy "subscription_bank_transfers: agency submits own" on subscription_bank_transfers
  for insert with check (
    account_type = 'broker_agency'
    and brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
    and submitted_by = auth.uid()
  );

-- ---------- subscription_grants: broker_agency as a 4th type ----------
alter table subscription_grants add column if not exists brokerage_id uuid references brokerages(id) on delete cascade;
create index if not exists subscription_grants_brokerage_id_idx on subscription_grants(brokerage_id);

alter table subscription_grants drop constraint if exists subscription_grants_account_match;
alter table subscription_grants drop constraint if exists subscription_grants_account_type_check;
alter table subscription_grants add constraint subscription_grants_account_type_check
  check (account_type in ('developer', 'broker', 'salesperson', 'broker_agency'));
alter table subscription_grants add constraint subscription_grants_account_match check (
  (account_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null and brokerage_id is null) or
  (account_type = 'broker' and broker_id is not null and developer_id is null and salesperson_id is null and brokerage_id is null) or
  (account_type = 'salesperson' and salesperson_id is not null and developer_id is null and broker_id is null and brokerage_id is null) or
  (account_type = 'broker_agency' and brokerage_id is not null and developer_id is null and broker_id is null and salesperson_id is null)
);

create policy "subscription_grants: agency reads own" on subscription_grants for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);

-- ---------- broker_agency_payments: mirrors broker_payments ----------
create table broker_agency_payments (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references brokerages(id) on delete cascade,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  amount numeric not null,
  currency text not null default 'aed',
  status text not null check (status in ('paid','failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index broker_agency_payments_brokerage_id_idx on broker_agency_payments(brokerage_id);

alter table broker_agency_payments enable row level security;
create policy "broker_agency_payments: owner reads own" on broker_agency_payments for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
create policy "broker_agency_payments: admin manages all" on broker_agency_payments for all using (is_admin()) with check (is_admin());

notify pgrst, 'reload schema';
