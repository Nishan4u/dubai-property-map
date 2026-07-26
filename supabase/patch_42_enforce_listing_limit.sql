-- Enforces subscription_plans.feature_limits->>'max_active_listings' at the
-- database level (a trigger, not app code) so it can't be bypassed by any
-- insert path — the app's own form, a future admin tool, or a raw API call
-- with a valid session all go through this same check. "Active" means
-- published/featured (what actually appears on the public map), not drafts.
create or replace function check_project_listing_limit() returns trigger as $$
declare
  v_limit int;
  v_count int;
begin
  if new.status not in ('published', 'featured') then
    return new;
  end if;

  select (sp.feature_limits->>'max_active_listings')::int into v_limit
  from developers d
  join subscription_plans sp on sp.key = d.plan_tier
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

drop trigger if exists enforce_project_listing_limit on projects;
create trigger enforce_project_listing_limit
  before insert or update of status on projects
  for each row execute function check_project_listing_limit();
