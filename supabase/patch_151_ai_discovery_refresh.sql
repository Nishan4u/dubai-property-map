-- AI Project Discovery -- change detection / 24h refresh on already-
-- discovered listings (follow-on to patch_150). The daily cloud routine
-- now also re-checks its own past web_discovery projects for real field
-- changes (construction progress, price, handover date, payment plan),
-- instead of only ever discovering brand-new ones. Scoped deliberately
-- to ai_source_type = 'web_discovery' only -- manual and brochure-
-- uploaded projects are never touched by this pipeline, matching the
-- original AI Project Discovery plan's own boundary.

alter table projects add column if not exists ai_last_checked_at timestamptz;
-- Nullable. Set only when the ingest route actually re-checks an
-- already-discovered project (see the ingest route's refresh branch).
-- Stays null forever for manual/brochure-upload projects.

alter table project_ai_extractions add column if not exists is_refresh boolean not null default false;
-- false (the correct default for every existing row) = the initial
-- discovery extraction that created the project. true = a later
-- refresh-check extraction snapshot for the same project.

create table if not exists project_ai_field_changes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  field_name text not null,
  old_value text,
  new_value text,
  confidence numeric,
  source_urls text[] not null default '{}',
  -- true = confidence met the same ai_discovery_confidence_threshold
  -- used for auto-publish, and the project row was actually updated.
  -- false = a real change was detected but confidence was too low (or
  -- the ai_discovery_enabled kill switch is off) -- logged for admin
  -- visibility, never applied, never shown publicly.
  applied boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists project_ai_field_changes_project_id_idx on project_ai_field_changes(project_id);
create index if not exists project_ai_field_changes_project_created_idx on project_ai_field_changes(project_id, created_at desc);

alter table project_ai_field_changes enable row level security;
-- Public reads only ever surface applied=true rows (by construction
-- already reflected in the live published project, same transparency
-- spirit as the AiDiscoveryDisclosure badge itself) -- app code also
-- scopes this to a project the visitor can already see via the
-- projects table's own RLS, so this adds no separate leak vector.
drop policy if exists "project_ai_field_changes: public reads applied" on project_ai_field_changes;
create policy "project_ai_field_changes: public reads applied" on project_ai_field_changes
  for select using (applied = true);
drop policy if exists "project_ai_field_changes: admin reads all" on project_ai_field_changes;
create policy "project_ai_field_changes: admin reads all" on project_ai_field_changes
  for select using (is_admin());
-- No insert/update/delete policy for anyone -- only ever written by the
-- service-role ingest route, same precedent as project_ai_extractions.

notify pgrst, 'reload schema';
