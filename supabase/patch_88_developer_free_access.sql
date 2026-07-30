-- Extends the admin "Global Free Access" panel (patch_72) to cover
-- developers too. Developers already always have "ok" map access
-- (getMapAccessStatus / get_viewer_map_access_status short-circuit on
-- role === 'developer'), so this toggle serves a different purpose for
-- them specifically: bypassing the per-plan active-listing cap enforced
-- by check_project_listing_limit() (patch_42/patch_50), giving every
-- developer account unlimited listings while enabled -- without needing
-- to grant each one an individual free subscription (patch_41's
-- subscription_grants, still available separately for one-off grants).
alter table free_access_settings drop constraint if exists free_access_settings_account_type_check;
alter table free_access_settings add constraint free_access_settings_account_type_check
  check (account_type in ('broker', 'broker_agency', 'salesperson', 'developer'));

insert into free_access_settings (account_type, enabled) values ('developer', false)
on conflict (account_type) do nothing;

create or replace function check_project_listing_limit() returns trigger as $$
declare
  v_limit int;
  v_count int;
  v_developer_free_access boolean;
begin
  if new.status not in ('published', 'featured') then
    return new;
  end if;

  select enabled into v_developer_free_access from free_access_settings where account_type = 'developer';
  if v_developer_free_access then
    return new;
  end if;

  select (sp.feature_limits->>'max_active_listings')::int into v_limit
  from developers d
  join subscription_plans sp on sp.key = (
    case when d.subscription_status = 'active' or d.is_complimentary then d.plan_tier else 'free' end
  )
  where d.id = new.developer_id;

  if v_limit is not null then
    select count(*) into v_count
    from projects
    where developer_id = new.developer_id
      and status in ('published', 'featured')
      and id is distinct from new.id;

    if v_count >= v_limit then
      raise exception 'Listing limit reached: your current plan allows % active listing(s). Upgrade your plan to publish more.', v_limit
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

notify pgrst, 'reload schema';
