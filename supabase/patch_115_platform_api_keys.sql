-- Module 15 "API & Webhooks" (API Keys/API Logs) + Module 27 "API Security"
-- + Module 2 "API Permissions": a generic, admin-issued API key system for
-- external partners/integrators to read the platform's own public data
-- (published projects, communities, developers) over a real REST API --
-- distinct from crm_integrations (patch_111), which is per-broker/
-- salesperson/developer outbound webhook dispatch + a single owner's own
-- CRM pull feed. This is inbound: anyone the admin issues a key to can call
-- GET /api/v1/*.
--
-- The raw key is never stored -- only a sha256 hash, checked at request
-- time in src/lib/apiAuth.ts. key_prefix keeps enough of the key visible
-- in the admin UI to identify it without ever being able to reconstruct it.
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_by uuid references profiles(id) on delete set null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists api_keys_key_hash_idx on api_keys(key_hash);

alter table api_keys enable row level security;

drop policy if exists "Admins manage API keys" on api_keys;
create policy "Admins manage API keys" on api_keys for all
  using (is_admin()) with check (is_admin());

create table if not exists api_request_logs (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references api_keys(id) on delete cascade,
  endpoint text not null,
  status_code int not null,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists api_request_logs_api_key_id_idx on api_request_logs(api_key_id);
create index if not exists api_request_logs_created_at_idx on api_request_logs(created_at desc);

alter table api_request_logs enable row level security;

drop policy if exists "Admins read API request logs" on api_request_logs;
create policy "Admins read API request logs" on api_request_logs for select
  using (is_admin());

notify pgrst, 'reload schema';
