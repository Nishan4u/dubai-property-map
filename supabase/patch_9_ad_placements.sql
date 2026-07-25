create table ad_placements (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references developers(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  placement_type text not null check (placement_type in ('homepage_banner','sidebar_banner','sponsored_pin')),
  title text not null,
  target_url text,
  status text not null default 'pending' check (status in ('pending','active','rejected','expired')),
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now()
);

alter table ad_placements enable row level security;

create policy "ad_placements: public read active" on ad_placements for select using (
  status = 'active'
  and (starts_at is null or starts_at <= current_date)
  and (ends_at is null or ends_at >= current_date)
);

create policy "ad_placements: developer manages own" on ad_placements for all using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
  and status = 'pending'
);

create policy "ad_placements: admin manages all" on ad_placements for all
  using (is_admin()) with check (is_admin());
