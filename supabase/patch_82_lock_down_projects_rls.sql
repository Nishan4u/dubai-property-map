-- Part 1 of 2 for the Revision 2 §14 finding: the "projects: public read
-- approved" policy (patch_3) grants full-row read to ANY anon or
-- authenticated request for every published/approved project, with no
-- subscription check at all -- gating for guests/brokers/salespersons/
-- agencies has only ever been enforced by the app choosing not to fetch the
-- data, not by the database. A direct Supabase REST call with the (public)
-- anon key bypasses that entirely.
--
-- This patch only adds the SQL functions + a public-safe view -- it makes
-- NO behavior change on its own (the old policy is untouched here). This is
-- deliberately separated from patch_83 (the actual policy swap) so the
-- functions below can be tested against real accounts of every role first.
--
-- get_viewer_map_access_status() is a faithful SQL port of
-- getMapAccessStatus() in src/lib/supabase/queries.ts -- it MUST return
-- 'ok' in exactly the same cases that function does, since every existing
-- call site already guards on `mapAccessStatus === "ok"` before fetching;
-- if this function is stricter than the TS version, those already-
-- authorized fetches would start silently returning empty once patch_83
-- lands.
create or replace function public.resolve_subscription_map_access(
  p_status text, p_plan_key text, p_plan_type text
) returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_free_enabled boolean;
  v_map_access_included boolean;
begin
  select enabled into v_free_enabled from free_access_settings where account_type = p_plan_type;
  if coalesce(v_free_enabled, false) then
    return 'ok';
  end if;

  if p_status = 'expired' then
    return 'subscription_expired';
  end if;
  if p_status is distinct from 'active' then
    return 'no_subscription';
  end if;

  if p_plan_key is not null then
    select map_access_included into v_map_access_included
      from subscription_plans where key = p_plan_key and plan_type = p_plan_type;
    if v_map_access_included is false then
      return 'no_subscription';
    end if;
  end if;

  return 'ok';
end;
$$;

create or replace function public.get_viewer_map_access_status()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email_confirmed timestamptz;
  v_profile record;
  v_status text;
  v_plan_key text;
begin
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

grant execute on function public.resolve_subscription_map_access(text, text, text) to anon, authenticated;
grant execute on function public.get_viewer_map_access_status() to anon, authenticated;

-- Minimal public-safe projection for the two legitimate cases that need
-- SOME project data without an authorized session: generateMetadata (so
-- shared links still unfurl with a title/image/price) and sitemap.xml (so
-- search engines can crawl project URLs). Deliberately excludes every field
-- the actual protected detail page shows (payment plan, escrow, amenities,
-- unit types, virtual tour, video, gallery, documents, contact info).
create view projects_public_meta as
select
  p.id,
  p.slug,
  p.name,
  p.description,
  p.property_type,
  p.price_from_aed,
  p.cover_image_url,
  p.lat,
  p.lng,
  p.developer_id,
  p.community_id,
  p.updated_at,
  d.name as developer_name,
  d.slug as developer_slug,
  c.name as community_name,
  c.slug as community_slug
from projects p
left join developers d on d.id = p.developer_id
left join communities c on c.id = p.community_id
where p.status in ('published', 'featured') and p.approval_status = 'approved';

grant select on projects_public_meta to anon, authenticated;

notify pgrst, 'reload schema';
