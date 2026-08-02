-- Broker/Salesperson Referral Program (Sections 4-6): two small additions
-- to already-existing tables.
--
-- 1. subscription_plans only stores a display string (price_label, e.g.
--    "AED 100/year") -- there's no real number anywhere to compute a
--    referral discount amount, check wallet sufficiency, or total up
--    admin-facing discount/revenue stats against. This is the one gap in
--    the otherwise-already-built Subscription Pricing Management system
--    (AdminPackagesManager.tsx) that this feature actually needs; adding
--    it here rather than as a separate unrelated migration.
alter table subscription_plans add column if not exists price_aed numeric(10, 2);

-- 2. "Pay with Wallet Balance" (spec item 6) is a 4th payment_type value
--    alongside the existing stripe/bank_transfer/admin_free, so it can
--    reuse the exact same subscription-activation code path the
--    bank-transfer-approve flow already uses, instead of inventing a
--    parallel one. Finds the actual auto-generated check-constraint name
--    from pg_constraint rather than assuming it, so this doesn't fail if
--    Postgres named it differently than expected.
do $$
declare
  v_conname text;
begin
  select conname into v_conname from pg_constraint
    where conrelid = 'brokers'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%payment_type%';
  if v_conname is not null then
    execute format('alter table brokers drop constraint %I', v_conname);
  end if;
  alter table brokers add constraint brokers_payment_type_check
    check (payment_type in ('stripe', 'bank_transfer', 'admin_free', 'wallet'));

  select conname into v_conname from pg_constraint
    where conrelid = 'salespersons'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%payment_type%';
  if v_conname is not null then
    execute format('alter table salespersons drop constraint %I', v_conname);
  end if;
  alter table salespersons add constraint salespersons_payment_type_check
    check (payment_type in ('stripe', 'bank_transfer', 'admin_free', 'wallet'));
end;
$$;

notify pgrst, 'reload schema';
