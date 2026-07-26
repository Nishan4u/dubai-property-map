-- Subscription engine: package metadata admins can actually configure,
-- salesperson billing (mirrors brokers), and an audit trail for admin
-- free-grants. Nothing here changes existing developer/broker billing
-- behavior — every new column has a default that matches today's implicit
-- behavior (status='active', online/bank-transfer both enabled, etc.).

-- ---------- subscription_plans: richer, admin-editable metadata ----------
alter table subscription_plans
  add column if not exists description text,
  add column if not exists duration_days int,
  add column if not exists status text not null default 'active' check (status in ('active', 'inactive')),
  add column if not exists is_popular boolean not null default false,
  add column if not exists is_recommended boolean not null default false,
  add column if not exists online_payment_enabled boolean not null default true,
  add column if not exists bank_transfer_enabled boolean not null default true,
  add column if not exists feature_limits jsonb not null default '{}'::jsonb;

alter table subscription_plans drop constraint if exists subscription_plans_plan_type_check;
alter table subscription_plans add constraint subscription_plans_plan_type_check
  check (plan_type in ('developer', 'broker', 'salesperson'));

-- Real, enforceable limits for the existing developer plan copy (matches
-- the "N active listings" / "Featured pins (N)" / "Homepage banner"
-- language already on the pricing cards — this is what actually gets
-- checked at project-creation and ad-request time, not just displayed).
update subscription_plans set feature_limits = '{"max_active_listings": 3, "max_featured_pins": 0, "homepage_banner_allowed": false}'::jsonb, duration_days = null where key = 'free';
update subscription_plans set feature_limits = '{"max_active_listings": 15, "max_featured_pins": 0, "homepage_banner_allowed": false}'::jsonb, duration_days = 30 where key = 'starter';
update subscription_plans set feature_limits = '{"max_active_listings": null, "max_featured_pins": 2, "homepage_banner_allowed": false}'::jsonb, duration_days = 30, is_popular = true where key = 'professional';
update subscription_plans set feature_limits = '{"max_active_listings": null, "max_featured_pins": 999, "homepage_banner_allowed": true}'::jsonb, duration_days = null where key = 'enterprise';
update subscription_plans set duration_days = 30 where key = 'broker-monthly';

-- ---------- salespersons: personal subscription, mirrors brokers ----------
alter table salespersons
  add column if not exists plan_key text references subscription_plans(key),
  add column if not exists subscription_status text not null default 'no_subscription'
    check (subscription_status in ('no_subscription', 'payment_pending', 'active', 'expired', 'cancelled', 'payment_failed')),
  add column if not exists is_complimentary boolean not null default false,
  add column if not exists subscription_expires_at date,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists payment_type text check (payment_type in ('stripe', 'bank_transfer', 'admin_free'));

revoke update (
  plan_key, subscription_status, is_complimentary, subscription_expires_at,
  stripe_customer_id, stripe_subscription_id, payment_type
) on salespersons from authenticated;

insert into subscription_plans (key, name, price_label, features, plan_type, sort_order, description, duration_days) values
  ('salesperson-monthly', 'Salesperson Access', 'AED 30/mo', ARRAY[
    'Receive leads from your developer',
    'Manage assigned property requests',
    'Track your own performance'
  ], 'salesperson', 0, 'Individual access for salespersons registered under a developer.', 30)
on conflict (key) do nothing;

-- payment_type on developers/brokers too, for the same "Payment Type:
-- Admin Granted / Free" display the spec asks for on every account type.
alter table developers add column if not exists payment_type text check (payment_type in ('stripe', 'bank_transfer', 'admin_free'));
alter table brokers add column if not exists payment_type text check (payment_type in ('stripe', 'bank_transfer', 'admin_free'));
revoke update (payment_type) on developers from authenticated;
revoke update (payment_type) on brokers from authenticated;

-- ---------- subscription_bank_transfers: add salesperson as a 3rd type ----------
alter table subscription_bank_transfers add column if not exists salesperson_id uuid references salespersons(id) on delete cascade;
create index if not exists subscription_bank_transfers_salesperson_id_idx on subscription_bank_transfers(salesperson_id);

alter table subscription_bank_transfers drop constraint if exists subscription_bank_transfers_account_type_check;
alter table subscription_bank_transfers add constraint subscription_bank_transfers_account_type_check
  check (account_type in ('developer', 'broker', 'salesperson'));

alter table subscription_bank_transfers drop constraint if exists subscription_bank_transfers_account_match;
alter table subscription_bank_transfers add constraint subscription_bank_transfers_account_match check (
  (account_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null) or
  (account_type = 'broker' and broker_id is not null and developer_id is null and salesperson_id is null) or
  (account_type = 'salesperson' and salesperson_id is not null and developer_id is null and broker_id is null)
);

create policy "subscription_bank_transfers: salesperson reads own" on subscription_bank_transfers
  for select using (salesperson_id = (select salesperson_id from profiles where id = auth.uid()));

create policy "subscription_bank_transfers: salesperson submits own" on subscription_bank_transfers
  for insert with check (
    account_type = 'salesperson'
    and salesperson_id = (select salesperson_id from profiles where id = auth.uid())
    and submitted_by = auth.uid()
  );

-- ---------- subscription_grants: audit trail for admin free-grants ----------
create table subscription_grants (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('developer', 'broker', 'salesperson')),
  developer_id uuid references developers(id) on delete cascade,
  broker_id uuid references brokers(id) on delete cascade,
  salesperson_id uuid references salespersons(id) on delete cascade,
  plan_key text not null references subscription_plans(key),
  granted_by uuid not null references profiles(id),
  start_date date not null default current_date,
  expiry_date date,
  reason text,
  revoked_at timestamptz,
  revoked_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  constraint subscription_grants_account_match check (
    (account_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null) or
    (account_type = 'broker' and broker_id is not null and developer_id is null and salesperson_id is null) or
    (account_type = 'salesperson' and salesperson_id is not null and developer_id is null and broker_id is null)
  )
);
create index subscription_grants_developer_id_idx on subscription_grants(developer_id);
create index subscription_grants_broker_id_idx on subscription_grants(broker_id);
create index subscription_grants_salesperson_id_idx on subscription_grants(salesperson_id);

alter table subscription_grants enable row level security;
create policy "subscription_grants: admin manages all" on subscription_grants for all using (is_admin()) with check (is_admin());
create policy "subscription_grants: developer reads own" on subscription_grants for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "subscription_grants: broker reads own" on subscription_grants for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "subscription_grants: salesperson reads own" on subscription_grants for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
