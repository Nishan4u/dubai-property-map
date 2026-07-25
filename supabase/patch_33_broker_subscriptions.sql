-- Broker subscription plans reuse the existing admin-editable
-- subscription_plans table (patch_24) rather than a parallel system —
-- plan_type distinguishes which portal a plan is offered in.

alter table subscription_plans
  add column plan_type text not null default 'developer' check (plan_type in ('developer','broker'));

insert into subscription_plans (key, name, price_label, features, plan_type, sort_order) values
  ('broker-monthly', 'Broker Membership', 'AED 50/mo', ARRAY[
    'Full property map access',
    'Browse developer projects',
    'Send property requests',
    'Select developer salesperson',
    'Track requests',
    'Contact salesperson directly',
    'One-device account access'
  ], 'broker', 0);

-- No FK needs adding here for brokers.plan_key -> subscription_plans.key:
-- patch_30 already declared it inline (`plan_key text references
-- subscription_plans(key)`), which auto-created that constraint.

-- Payment ledger populated from Stripe webhook events — gives admin
-- "View Payments / Export Transactions" as a plain fast query instead of
-- a live Stripe API call on every page load. Actual invoices/receipts
-- still come from Stripe's own hosted Billing Portal, same as developers.
create table broker_payments (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references brokers(id) on delete cascade,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  amount numeric not null,
  currency text not null default 'aed',
  status text not null check (status in ('paid','failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index broker_payments_broker_id_idx on broker_payments(broker_id);

alter table broker_payments enable row level security;
create policy "broker_payments: owner reads own" on broker_payments for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "broker_payments: admin manages all" on broker_payments for all using (is_admin()) with check (is_admin());
-- No client-facing insert policy — written only via the service-role
-- Stripe webhook handler.
