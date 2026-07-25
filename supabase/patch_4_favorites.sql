create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

alter table favorites enable row level security;

create policy "favorites: read own" on favorites for select using (user_id = auth.uid());
create policy "favorites: insert own" on favorites for insert with check (user_id = auth.uid());
create policy "favorites: delete own" on favorites for delete using (user_id = auth.uid());
