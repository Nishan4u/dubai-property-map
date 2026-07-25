create table team_members (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references developers(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'Sales',
  status text not null default 'invited' check (status in ('invited','active','removed')),
  created_at timestamptz not null default now()
);

alter table team_members enable row level security;

create policy "team_members: developer manages own" on team_members for all using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);

create policy "team_members: admin reads all" on team_members for select using (is_admin());
