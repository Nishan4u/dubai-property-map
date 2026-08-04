-- Subscription Pricing Management, last two open items:
-- 1. A distinct renewal price, separate from the purchase price. Applied
--    everywhere price_aed is the literal amount charged programmatically
--    (Wallet payment, Network International) rather than a Stripe
--    recurring subscription price -- Stripe's own subscription mode
--    charges the same price every period by design (Subscription
--    Schedules would be needed to vary it, real but meaningfully bigger
--    scope, not attempted here). Null falls back to price_aed, so every
--    plan's behavior is unchanged until an admin explicitly sets one.
-- 2. A per-plan auto-renewal toggle. Rather than switching Stripe
--    Checkout's mode (which would require the underlying Stripe Price
--    object to also be reconfigured as one-time to avoid an API error --
--    a real footgun), this is wired as `cancel_at_period_end: true` on
--    the Stripe subscription itself when disabled: the subscription still
--    charges normally through mode: "subscription", then cancels instead
--    of renewing -- the same "pay for a period, come back to renew" shape
--    Bank Transfer/Network International already have, achieved with a
--    single Stripe parameter instead of a mode-compatibility risk.
alter table subscription_plans add column if not exists renewal_price_aed numeric(10, 2);
alter table subscription_plans add column if not exists auto_renewal_enabled boolean not null default true;

notify pgrst, 'reload schema';
