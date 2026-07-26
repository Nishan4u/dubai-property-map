-- Adds a distinct 'suspended' subscription_status so admin can freeze paid
-- entitlements on a subscription without cancelling it or deleting any
-- history. This is separate from profiles.suspended (which blocks the whole
-- account's login/access) — a suspended subscription only drops the account
-- back to free-tier entitlements, same as any other non-active status,
-- since check_project_listing_limit() (patch_50) already gates paid
-- entitlements on subscription_status = 'active' or is_complimentary.
--
-- Finds and drops whatever the existing subscription_status check
-- constraint is actually named (rather than assuming a name), then adds it
-- back with 'suspended' included.

do $$
declare
  r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'developers'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%subscription_status%'
  loop
    execute format('alter table developers drop constraint %I', r.conname);
  end loop;
end $$;

alter table developers add constraint developers_subscription_status_check
  check (subscription_status in ('inactive', 'active', 'past_due', 'cancelled', 'expired', 'suspended'));

do $$
declare
  r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'brokers'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%subscription_status%'
  loop
    execute format('alter table brokers drop constraint %I', r.conname);
  end loop;
end $$;

alter table brokers add constraint brokers_subscription_status_check
  check (subscription_status in ('no_subscription', 'payment_pending', 'active', 'expired', 'cancelled', 'payment_failed', 'suspended'));

do $$
declare
  r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'salespersons'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%subscription_status%'
  loop
    execute format('alter table salespersons drop constraint %I', r.conname);
  end loop;
end $$;

alter table salespersons add constraint salespersons_subscription_status_check
  check (subscription_status in ('no_subscription', 'payment_pending', 'active', 'expired', 'cancelled', 'payment_failed', 'suspended'));
