-- Search & AI Usage Analytics (rest of Module 19). Two new tracking
-- tables, neither existed before -- backs the "Search Analytics" and
-- "AI Usage Reports" tabs added to /admin/reports alongside the ones
-- shipped in the prior Business Intelligence Reports batch.
--
-- Every statement is safely re-runnable (create table if not exists,
-- drop policy if exists before create), per the lesson from patch_104:
-- Supabase's SQL editor doesn't roll back the whole pasted script on a
-- single statement's error, it continues past it.

-- Mirrors project_events' exact shape (patch_16): anyone can log,
-- admin-only read, no user_id tracked -- aggregate counts only.
create table if not exists search_log (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  source text not null check (source in ('projects_list', 'map', 'communities', 'global_header')),
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists search_log_created_at_idx on search_log(created_at desc);

alter table search_log enable row level security;

drop policy if exists "search_log: anyone can log" on search_log;
create policy "search_log: anyone can log" on search_log for insert with check (true);

drop policy if exists "search_log: admin reads all" on search_log;
create policy "search_log: admin reads all" on search_log for select using (is_admin());

create table if not exists ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('mapai', 'broker', 'sales')),
  -- Bare uuid, no FK -- "whichever id the calling wrapper considers its
  -- own identity" (a buyer's profiles.id for MapAI, but brokers.id /
  -- salespersons.id for the two portal assistants, which don't line up
  -- with profiles.id 1:1 in this schema). Used for optional lookup in
  -- the report, never joined.
  user_id uuid,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_log_created_at_idx on ai_usage_log(created_at desc);

alter table ai_usage_log enable row level security;

drop policy if exists "ai_usage_log: admin reads all" on ai_usage_log;
create policy "ai_usage_log: admin reads all" on ai_usage_log for select using (is_admin());
-- No insert policy -- written only via the service-role client from
-- within the streaming API routes, same stance as broker_payments.

notify pgrst, 'reload schema';
