-- One-device-per-broker enforcement. The partial unique index is what
-- actually makes "one active session per broker" safe under concurrent
-- login attempts — a second concurrent insert fails atomically with a
-- Postgres unique_violation (23505) instead of racing an app-level
-- check-then-insert.
create table broker_sessions (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references brokers(id) on delete cascade,
  device_label text not null,
  ip text,
  device_token_hash text not null,
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  last_active timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references profiles(id)
);
create unique index broker_sessions_broker_active_uidx on broker_sessions (broker_id) where (status = 'active');
create index broker_sessions_token_hash_idx on broker_sessions (device_token_hash);

alter table broker_sessions enable row level security;
create policy "broker_sessions: owner reads own" on broker_sessions for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "broker_sessions: owner inserts own" on broker_sessions for insert with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "broker_sessions: owner updates own" on broker_sessions for update using (
  broker_id = (select broker_id from profiles where id = auth.uid())
) with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "broker_sessions: admin manages all" on broker_sessions for all using (is_admin()) with check (is_admin());

-- Device-recovery OTPs. Deliberately NO owner-facing policy at all — only
-- ever written/read via the service-role client from the request-otp /
-- verify-otp routes, so a compromised broker session can never read a
-- live OTP hash for itself or anyone else.
create table broker_login_otps (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references brokers(id) on delete cascade,
  purpose text not null default 'logout_other_device' check (purpose in ('logout_other_device')),
  otp_hash text not null,
  attempt_count int not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table broker_login_otps enable row level security;
create policy "broker_login_otps: admin manages all" on broker_login_otps for all using (is_admin()) with check (is_admin());
