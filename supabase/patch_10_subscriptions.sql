alter table developers
  add column plan_tier text not null default 'free' check (plan_tier in ('free','starter','professional','enterprise')),
  add column subscription_status text not null default 'inactive' check (subscription_status in ('inactive','active','past_due','cancelled')),
  add column stripe_customer_id text,
  add column stripe_subscription_id text;

-- Server-side only (via service_role, used by the Stripe webhook handler) —
-- developers should never be able to set their own plan_tier directly.
revoke update (plan_tier, subscription_status, stripe_customer_id, stripe_subscription_id) on developers from authenticated;
