-- Admin Panel -> Settings -> Registration Types: independently enable or
-- disable registration per account type. Existing accounts are never
-- affected -- this only gates the /register form and the /api/auth/register
-- endpoint, never anything about an already-created account.
create table registration_type_settings (
  account_type text primary key check (account_type in ('buyer', 'developer', 'broker', 'broker_agency', 'salesperson')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table registration_type_settings enable row level security;
create policy "registration_type_settings: public read" on registration_type_settings for select using (true);
create policy "registration_type_settings: admin manages" on registration_type_settings for all using (is_admin()) with check (is_admin());

insert into registration_type_settings (account_type, enabled) values
  ('buyer', true),
  ('developer', true),
  ('broker', true),
  ('broker_agency', true),
  ('salesperson', true)
on conflict (account_type) do nothing;
