-- Urgent fix: a developer creating a new project could never view it,
-- even from their own "All Projects" -- new projects start with
-- approval_status = 'pending' (ProjectForm.tsx) until an admin approves
-- them, but projects_public_meta (patch_82) only ever included
-- published+approved rows. The details page uses this view for its
-- existence/ownership pre-check BEFORE the access gate (so a guest gets
-- the gate instead of a false 404), but that same narrow view was also
-- wrongly gating the OWNING developer's own pending project, which the
-- base table's RLS has always exempted via its own "developer manages own"
-- clause (patch_3/patch_83) regardless of approval_status.
--
-- Fix: the view is now viewer-aware -- auth.uid() still resolves correctly
-- inside a plain view even though views bypass the underlying table's RLS,
-- since it reads the request's JWT context, not table-level policy state.
create or replace view projects_public_meta as
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
where
  (p.status in ('published', 'featured') and p.approval_status = 'approved')
  or p.developer_id = (select developer_id from profiles where id = auth.uid())
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin');

-- Second, unrelated fix bundled into the same round-trip: a logged-in
-- developer/salesperson viewing the homepage map saw every developer's
-- "Coming Soon" pins, not just their own -- "Developer sees ONLY own
-- projects everywhere" should also cover this teaser layer. developer_id
-- wasn't previously exposed by this view (only name/slug), needed now so
-- the app can filter pins down to the viewer's own developer when scoped.
create or replace view upcoming_projects_public as
select
  up.id,
  up.lat,
  up.lng,
  coalesce(up.logo_url, d.logo_url) as logo_url,
  d.name as developer_name,
  d.slug as developer_slug,
  up.developer_id
from upcoming_projects up
join developers d on d.id = up.developer_id
where up.status = 'active';

grant select on upcoming_projects_public to anon, authenticated;

notify pgrst, 'reload schema';
