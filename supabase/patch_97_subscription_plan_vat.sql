-- Subscription Pricing Management gap: VAT configuration per plan.
-- VAT is already included in price_aed -- this platform doesn't collect it
-- as a separate line item from subscribers, and nothing charges extra on
-- top of it. This column exists purely to back the VAT portion out of that
-- inclusive price: shown as an informational breakdown on the Subscription
-- pages ("Includes 5% VAT"), and broken out per row in the admin payments
-- export for VAT filing. Not a Stripe Tax integration -- Stripe checkout
-- continues to charge whatever the plan's Stripe Price ID is configured
-- for in the Stripe Dashboard, unchanged.
alter table subscription_plans add column if not exists vat_percent numeric(5, 2) check (vat_percent is null or vat_percent >= 0);

notify pgrst, 'reload schema';
