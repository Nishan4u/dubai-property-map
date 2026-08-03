-- Security batch: Login History (part of Module 1/27). audit_log
-- (patch_19) can't serve this purpose -- it has no ip/user_agent columns
-- and RLS restricts it to admins only, so a normal user could never read
-- their own login history. This is a separate, self-service table:
-- owners read/insert their own rows, admins can read all.
create table login_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  ip text,
  user_agent text,
  success boolean not null default true,
  created_at timestamptz not null default now()
);

create index login_history_user_id_created_at_idx on login_history (user_id, created_at desc);

alter table login_history enable row level security;

create policy "login_history: owner reads own" on login_history for select using (
  user_id = auth.uid()
);

create policy "login_history: owner inserts own" on login_history for insert with check (
  user_id = auth.uid()
);

create policy "login_history: admin reads all" on login_history for select using (
  is_admin()
);

notify pgrst, 'reload schema';
