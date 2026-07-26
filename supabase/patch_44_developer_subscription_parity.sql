-- Developers already have plan_tier/subscription_status/stripe_* (patch_10)
-- and payment_type (patch_41), but unlike brokers and salespersons they lack
-- is_complimentary/subscription_expires_at. The admin "Grant Free
-- Subscription" tool and the unified subscription view need to treat all
-- three account types the same way, so bring developers up to parity.
-- Defaults match today's implicit behavior (no developer is currently
-- complimentary or has a tracked expiry), so this changes nothing for
-- existing accounts.
alter table developers
  add column if not exists is_complimentary boolean not null default false,
  add column if not exists subscription_expires_at date;

revoke update (is_complimentary, subscription_expires_at) on developers from authenticated;
