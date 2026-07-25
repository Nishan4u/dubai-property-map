-- Big batch: project launch date / unit-type pricing / installment detail,
-- real construction progress + milestones, real interaction-event tracking
-- (clicks/whatsapp/phone/map pin), granular team permissions, and a new
-- 'community_banner' ad placement type.

alter table projects
  add column launch_date date,
  add column unit_type_prices jsonb not null default '{}',
  add column payment_plan_details jsonb not null default '[]',
  add column construction_progress_percent int not null default 0 check (construction_progress_percent between 0 and 100);

create table construction_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  milestone_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table construction_milestones enable row level security;
create policy "construction_milestones: public read" on construction_milestones for select using (true);
create policy "construction_milestones: developer manages own" on construction_milestones for all
  using (project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid())))
  with check (project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid())));
create policy "construction_milestones: admin manages" on construction_milestones for all using (is_admin()) with check (is_admin());

create table project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  event_type text not null check (event_type in ('click','whatsapp','phone','map_click')),
  created_at timestamptz not null default now()
);

alter table project_events enable row level security;
create policy "project_events: anyone can log" on project_events for insert with check (true);
create policy "project_events: developer reads own" on project_events for select using (
  project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid()))
);
create policy "project_events: admin reads all" on project_events for select using (is_admin());

alter table team_members
  add column can_manage_projects boolean not null default true,
  add column can_manage_leads boolean not null default true,
  add column can_manage_billing boolean not null default false;

alter table ad_placements drop constraint ad_placements_placement_type_check;
alter table ad_placements add constraint ad_placements_placement_type_check
  check (placement_type in ('homepage_banner','sidebar_banner','sponsored_pin','community_banner'));

alter table ad_placements add column community_id uuid references communities(id) on delete set null;
