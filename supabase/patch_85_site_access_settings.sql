-- Admin master switch: disable ALL subscription-based page restrictions
-- platform-wide (guests included), separate from free_access_settings
-- (which only covers broker/broker_agency/salesperson subscription
-- requirements, not guests -- guests always get "guest" status regardless
-- of that table). Singleton row, same public-read convention as
-- free_access_settings (just a flag, nothing sensitive) so the ordinary
-- authenticated/anon client used by getMapAccessStatus() can read it
-- directly.
create table site_access_settings (
  id boolean primary key default true check (id),
  restrictions_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table site_access_settings enable row level security;
create policy "site_access_settings: public read" on site_access_settings for select using (true);
create policy "site_access_settings: admin manages" on site_access_settings for all using (is_admin()) with check (is_admin());

insert into site_access_settings (id, restrictions_enabled) values (true, true)
on conflict (id) do nothing;

-- get_viewer_map_access_status() (patch_82) must respect the same switch --
-- when restrictions are disabled, every viewer (including a genuine guest)
-- resolves to 'ok', matching what getMapAccessStatus() now does in the app.
create or replace function public.get_viewer_map_access_status()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_restrictions_enabled boolean;
  v_uid uuid := auth.uid();
  v_email_confirmed timestamptz;
  v_profile record;
  v_status text;
  v_plan_key text;
begin
  select restrictions_enabled into v_restrictions_enabled from site_access_settings where id = true;
  if coalesce(v_restrictions_enabled, true) = false then
    return 'ok';
  end if;

  if v_uid is null then
    return 'guest';
  end if;

  select email_confirmed_at into v_email_confirmed from auth.users where id = v_uid;
  if v_email_confirmed is null then
    return 'guest';
  end if;

  select role, broker_id, broker_agency_id, salesperson_id, suspended
    into v_profile
    from profiles where id = v_uid;

  if v_profile is null or v_profile.suspended then
    return 'guest';
  end if;

  if v_profile.role in ('buyer', 'admin', 'developer') then
    return 'ok';
  end if;

  if v_profile.role = 'broker' and v_profile.broker_id is not null then
    select subscription_status, plan_key into v_status, v_plan_key
      from brokers where id = v_profile.broker_id;
    return public.resolve_subscription_map_access(v_status, v_plan_key, 'broker');
  end if;

  if v_profile.role = 'broker_agency' and v_profile.broker_agency_id is not null then
    select subscription_status, plan_key into v_status, v_plan_key
      from brokerages where id = v_profile.broker_agency_id;
    return public.resolve_subscription_map_access(v_status, v_plan_key, 'broker_agency');
  end if;

  if v_profile.role = 'salesperson' and v_profile.salesperson_id is not null then
    select subscription_status, plan_key into v_status, v_plan_key
      from salespersons where id = v_profile.salesperson_id;
    return public.resolve_subscription_map_access(v_status, v_plan_key, 'salesperson');
  end if;

  return 'guest';
end;
$$;

notify pgrst, 'reload schema';
