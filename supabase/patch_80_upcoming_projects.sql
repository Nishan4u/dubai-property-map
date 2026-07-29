-- Upcoming Projects on Mapbox (spec section 13). Developers can pre-publish
-- a "coming soon" pin before a project's real listing exists. The internal
-- project name must never be visible to the public -- this is enforced at
-- the database level (not just hidden in the UI): the base table is only
-- ever readable by its owning developer or an admin, and a separate public
-- view exposes only the developer's name/logo/coordinates for active pins,
-- deliberately omitting internal_name and developer_id.
create table upcoming_projects (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references developers(id) on delete cascade,
  internal_name text not null,
  lat numeric not null,
  lng numeric not null,
  logo_url text,
  status text not null default 'active' check (status in ('active', 'launched')),
  launched_project_id uuid references projects(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table upcoming_projects enable row level security;

create policy "upcoming_projects: developer manages own" on upcoming_projects for all
  using (developer_id = (select developer_id from profiles where id = auth.uid()))
  with check (developer_id = (select developer_id from profiles where id = auth.uid()));
create policy "upcoming_projects: admin manages" on upcoming_projects for all using (is_admin()) with check (is_admin());

-- Public-safe projection: never selects internal_name or developer_id, and
-- only ever returns pins that haven't launched yet. Views run with the
-- owning role's privileges against the base table, so this is reachable by
-- anon/authenticated even though the base table itself is locked down above.
create view upcoming_projects_public as
select
  up.id,
  up.lat,
  up.lng,
  coalesce(up.logo_url, d.logo_url) as logo_url,
  d.name as developer_name,
  d.slug as developer_slug
from upcoming_projects up
join developers d on d.id = up.developer_id
where up.status = 'active';

grant select on upcoming_projects_public to anon, authenticated;

notify pgrst, 'reload schema';
