-- BUG FIX: the listing-limit trigger enforced entitlements purely by
-- developers.plan_tier, never checking subscription_status — since the
-- expiry cron only flips subscription_status to 'expired' (it never resets
-- plan_tier back to 'free'), an expired or cancelled developer kept their
-- paid plan's limits indefinitely. Now falls back to the 'free' plan's
-- limits whenever the developer isn't active or complimentary.
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
