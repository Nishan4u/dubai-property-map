-- Analytics & Tracking (Module 26). Google Analytics, Search Analytics,
-- and Click Tracking already exist (AnalyticsScripts.tsx + platform_settings,
-- the prior Search Analytics batch, and project_events respectively) --
-- this adds the one genuinely missing piece of tracking: ad placement
-- click-through, backing a new "Conversion" report tab on /admin/reports.
--
-- Every statement is safely re-runnable (create table if not exists,
-- drop policy if exists before create), per the lesson from patch_104:
-- Supabase's SQL editor doesn't roll back the whole pasted script on a
-- single statement's error, it continues past it.

-- Mirrors project_events' exact shape (patch_16): no client-facing
-- insert policy -- rows are written only via the service-role client in
-- the new /api/ads/click/[id] redirect route, same stance as
-- broker_payments and search_log/ai_usage_log before it.
create table if not exists ad_placement_events (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references ad_placements(id) on delete cascade,
  event_type text not null check (event_type in ('click')),
  created_at timestamptz not null default now()
);
create index if not exists ad_placement_events_placement_id_idx on ad_placement_events(placement_id);

alter table ad_placement_events enable row level security;

drop policy if exists "ad_placement_events: developer reads own" on ad_placement_events;
create policy "ad_placement_events: developer reads own" on ad_placement_events for select using (
  placement_id in (select id from ad_placements where developer_id = (select developer_id from profiles where id = auth.uid()))
);

drop policy if exists "ad_placement_events: admin reads all" on ad_placement_events;
create policy "ad_placement_events: admin reads all" on ad_placement_events for select using (is_admin());

notify pgrst, 'reload schema';
