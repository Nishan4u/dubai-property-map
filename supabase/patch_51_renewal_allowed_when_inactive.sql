-- Disabling a plan previously blocked new signups AND renewals uniformly.
-- The spec wants those decided separately: admin can disable a plan for new
-- subscribers while still letting existing subscribers on it renew.
alter table subscription_plans
  add column if not exists renewal_allowed_when_inactive boolean not null default true;
