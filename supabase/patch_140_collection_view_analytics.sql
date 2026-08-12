-- Presentation Studio 2.0, item 2: minimal open-tracking for shared
-- Collections/Presentations (/present/[token]). Mirrors
-- ad_placement_events' (patch_108) shape exactly -- append-only, no
-- owner insert policy at all (rows are written only by the existing
-- service-role GET /api/presentations/[token] route), select derived
-- from crm_collections' current 4-way owner match (broker/salesperson/
-- developer/broker_agency, patch_106 + patch_117).
--
-- Deliberately NOT per-section/per-slide tracking in v1 -- a real
-- complexity jump, left as an explicit fast-follow. This table has room
-- to grow a nullable `section_key` column later without restructuring.
create table if not exists crm_collection_views (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references crm_collections(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists crm_collection_views_collection_id_idx on crm_collection_views(collection_id);
create index if not exists crm_collection_views_collection_created_idx on crm_collection_views(collection_id, created_at desc);

alter table crm_collection_views enable row level security;

drop policy if exists "crm_collection_views: broker reads own" on crm_collection_views;
create policy "crm_collection_views: broker reads own" on crm_collection_views for select using (
  collection_id in (select id from crm_collections where broker_id = (select broker_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_views: salesperson reads own" on crm_collection_views;
create policy "crm_collection_views: salesperson reads own" on crm_collection_views for select using (
  collection_id in (select id from crm_collections where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_views: developer reads own" on crm_collection_views;
create policy "crm_collection_views: developer reads own" on crm_collection_views for select using (
  collection_id in (select id from crm_collections where developer_id = (select developer_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_views: broker_agency reads own" on crm_collection_views;
create policy "crm_collection_views: broker_agency reads own" on crm_collection_views for select using (
  collection_id in (select id from crm_collections where brokerage_id = (select broker_agency_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_views: admin reads all" on crm_collection_views;
create policy "crm_collection_views: admin reads all" on crm_collection_views for select using (is_admin());

notify pgrst, 'reload schema';
