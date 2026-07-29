-- Structured unit types per project (spec section 9: "Unit Types") --
-- unlimited entries, each with its own name/type/price/size/beds/baths/
-- balcony/parking/availability. Separate from the existing coarse
-- unit_types text[] / unit_type_prices jsonb columns on projects, which
-- stay untouched for backwards compatibility with existing data.
create table project_unit_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  unit_name text not null,
  unit_type text not null,
  starting_price_aed numeric,
  size_sqft numeric,
  bedrooms int,
  bathrooms int,
  has_balcony boolean not null default false,
  has_parking boolean not null default false,
  availability text not null default 'available' check (availability in ('available', 'limited', 'sold_out')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table project_unit_types enable row level security;

-- Same convention as construction_milestones: gating for unauthorized
-- viewers happens at the application layer (the details page only calls
-- getProjectUnitTypes when mapAccessStatus === "ok"), not via RLS, since
-- this is public-catalogue data once a viewer is authorized.
create policy "project_unit_types: public read" on project_unit_types for select using (true);
create policy "project_unit_types: developer manages own" on project_unit_types for all
  using (project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid())))
  with check (project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid())));
create policy "project_unit_types: admin manages" on project_unit_types for all using (is_admin()) with check (is_admin());

notify pgrst, 'reload schema';
