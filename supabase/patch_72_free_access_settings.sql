-- Admin: Global Free Access, per account type (spec section 13). Scoped to
-- broker/salesperson/broker_agency -- the three types that share the same
-- uniform AED 100/year subscription gate (resolveSubscriptionMapAccess).
-- Developer pricing stays admin-configurable per-developer (section 12)
-- rather than a blanket platform-wide free switch. Individual per-account
-- free grants already exist via subscription_grants / Grant Free
-- Subscription -- this is the separate "flip the whole account type free"
-- control the spec also asks for.
create table free_access_settings (
  account_type text primary key check (account_type in ('broker', 'broker_agency', 'salesperson')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table free_access_settings enable row level security;
create policy "free_access_settings: public read" on free_access_settings for select using (true);
create policy "free_access_settings: admin manages" on free_access_settings for all using (is_admin()) with check (is_admin());
-- Public read (just a flag, nothing sensitive) so the ordinary
-- authenticated client used by getMapAccessStatus() and the property-
-- request submission routes can read it directly, same as
-- registration_type_settings.

insert into free_access_settings (account_type, enabled) values
  ('broker', false), ('broker_agency', false), ('salesperson', false)
on conflict (account_type) do nothing;

notify pgrst, 'reload schema';
