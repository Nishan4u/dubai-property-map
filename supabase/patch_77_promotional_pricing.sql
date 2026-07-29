-- Admin promotional pricing (spec section 6: "Create promotional pricing").
-- Deliberately separate columns from price_label/stripe_price_id rather
-- than overwriting them -- Stripe prices are immutable, so a promo needs
-- its own Stripe Price ID, and the normal price must stay intact and
-- restorable once the promo ends (spec: "the normal price remains AED
-- 100/year even if Admin temporarily provides free access" -- same
-- principle applies to a temporary promo discount).
alter table subscription_plans
  add column if not exists promo_price_label text,
  add column if not exists promo_stripe_price_id text,
  add column if not exists promo_active boolean not null default false,
  add column if not exists promo_ends_at date;

notify pgrst, 'reload schema';
