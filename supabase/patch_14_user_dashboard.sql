-- Real User Dashboard: saved searches, brochure download history, and
-- notifications, plus letting buyers read back their own leads/bookings
-- (previously only developers/admins could see them).

create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  filters jsonb not null,
  created_at timestamptz not null default now()
);

alter table saved_searches enable row level security;
create policy "saved_searches: read own" on saved_searches for select using (user_id = auth.uid());
create policy "saved_searches: insert own" on saved_searches for insert with check (user_id = auth.uid());
create policy "saved_searches: delete own" on saved_searches for delete using (user_id = auth.uid());

create table brochure_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table brochure_downloads enable row level security;
create policy "brochure_downloads: read own" on brochure_downloads for select using (user_id = auth.uid());
create policy "brochure_downloads: insert own" on brochure_downloads for insert with check (user_id = auth.uid());

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  project_id uuid references projects(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
create policy "notifications: read own" on notifications for select using (user_id = auth.uid());
create policy "notifications: insert own" on notifications for insert with check (user_id = auth.uid());
create policy "notifications: update own" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Buyers could previously never read back the leads/bookings they submitted
-- (only the developer/admin side could). This lets the account dashboard
-- show "My Viewing Requests" for real.
create policy "leads: user reads own submissions" on leads for select using (created_by = auth.uid());
create policy "bookings: user reads own submissions" on bookings for select using (created_by = auth.uid());
