-- IP Restrictions for the admin panel (last remaining item in Module
-- 27 "Security"). Off by default (enabled = false) so nothing changes
-- for anyone until a super-admin opts in.
create table admin_ip_restrictions_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false
);
insert into admin_ip_restrictions_settings (id, enabled) values (true, false);

create table admin_ip_allowlist (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  label text,
  created_at timestamptz not null default now()
);

alter table admin_ip_restrictions_settings enable row level security;
alter table admin_ip_allowlist enable row level security;

-- No public read (unlike site_access_settings, patch_85) -- this table
-- lists which IPs bypass admin-panel protection. src/proxy.ts's own read
-- bypasses RLS entirely via the service-role key instead, since proxy
-- execution has no session/auth context to read as.
create policy "admin_ip_restrictions_settings: admin reads" on admin_ip_restrictions_settings for select using (is_admin());
create policy "admin_ip_restrictions_settings: super admin manages" on admin_ip_restrictions_settings for all using (is_super_admin()) with check (is_super_admin());

create policy "admin_ip_allowlist: admin reads" on admin_ip_allowlist for select using (is_admin());
create policy "admin_ip_allowlist: super admin manages" on admin_ip_allowlist for all using (is_super_admin()) with check (is_super_admin());

notify pgrst, 'reload schema';
