-- Admin-only Auto-Renewal control (spec section 14) -- never shown to
-- normal users anywhere. Defaults to true (matches today's actual behavior:
-- Stripe subscriptions already auto-renew unless cancelled). Admin can flip
-- it off, which cancels the Stripe subscription at period end so it lapses
-- naturally instead of charging again.
alter table developers add column if not exists auto_renew boolean not null default true;
alter table brokers add column if not exists auto_renew boolean not null default true;
alter table salespersons add column if not exists auto_renew boolean not null default true;
alter table brokerages add column if not exists auto_renew boolean not null default true;

revoke update (auto_renew) on developers from authenticated;
revoke update (auto_renew) on brokers from authenticated;
revoke update (auto_renew) on salespersons from authenticated;
revoke update (auto_renew) on brokerages from authenticated;

notify pgrst, 'reload schema';
