-- Live Inventory Management (core), Module 16. project_unit_types
-- (patch_79) tracks CATEGORIES only (e.g. "2BR", a coarse 3-state
-- availability enum) -- this adds real individual numbered units within
-- a category, and wires them into the existing unit_reservations flow
-- (patch_104) so a reservation can lock a real unit instead of free text.
--
-- Every statement is safely re-runnable (create table if not exists,
-- drop policy if exists before create), matching the lesson from
-- patch_104: Supabase's SQL editor doesn't roll back the whole pasted
-- script on a single statement's error, it continues past it.

create table if not exists project_units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  unit_type_id uuid not null references project_unit_types(id) on delete cascade,
  unit_number text not null,
  floor text,
  price_aed numeric,
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, unit_number)
);
create index if not exists project_units_project_id_idx on project_units(project_id);
create index if not exists project_units_unit_type_id_idx on project_units(unit_type_id);

alter table project_units enable row level security;

-- Mirrors project_unit_types' exact 3-policy shape: public read (unit
-- inventory is shown on the public project page, same as unit types
-- already are), developer manages own, admin manages.
drop policy if exists "project_units: public read" on project_units;
create policy "project_units: public read" on project_units for select using (true);

drop policy if exists "project_units: developer manages own" on project_units;
create policy "project_units: developer manages own" on project_units for all
  using (project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid())))
  with check (project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid())));

drop policy if exists "project_units: admin manages" on project_units;
create policy "project_units: admin manages" on project_units for all using (is_admin()) with check (is_admin());

-- Nullable, additive -- existing reservations (and any project with no
-- inventory configured) keep unit_id null and behave exactly as before,
-- with unit_number staying the free-text display/fallback field.
alter table unit_reservations add column if not exists unit_id uuid references project_units(id) on delete set null;
create index if not exists unit_reservations_unit_id_idx on unit_reservations(unit_id) where unit_id is not null;

notify pgrst, 'reload schema';
