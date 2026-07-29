-- Super admin tier: an additive flag on top of the existing role='admin'
-- (not a new enum value) so every existing is_admin()/role==='admin' check
-- throughout the app keeps working unchanged for this account -- it only
-- gates the ONE new capability that should be exclusive to a super admin,
-- not every admin: the platform-wide restrictions master switch.
alter table profiles add column if not exists is_super_admin boolean not null default false;

create or replace function public.is_super_admin() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin' and is_super_admin = true
  );
$$ language sql stable security definer;

-- Tighten site_access_settings (patch_85) so only a super admin, not every
-- admin, can flip the switch that disables all page restrictions --
-- enforced at the database level, not just hidden in the admin UI.
drop policy if exists "site_access_settings: admin manages" on site_access_settings;
create policy "site_access_settings: super admin manages" on site_access_settings for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

notify pgrst, 'reload schema';
