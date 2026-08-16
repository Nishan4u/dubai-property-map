-- "Upload Brochure -> AI Draft Project" -- first slice of a larger AI
-- data-extraction pitch (see plan for full context). A developer
-- uploads a brochure PDF; Claude reads it and drafts a project; the
-- draft lands exactly like every other auto-sourced project in this
-- codebase already does (patch_91's precedent: status = 'draft',
-- approval_status defaults to 'pending', nothing visible publicly
-- until an admin reviews it) -- this patch adds nothing new to that
-- workflow, just a provenance marker plus a record of what was
-- extracted and how confident the model was, for the review UI.

alter table projects add column if not exists data_source text not null default 'manual'
  check (data_source in ('manual', 'ai_extracted'));
-- Every existing row, and every row the existing manual ProjectForm
-- creates going forward, keeps behaving exactly as it does today --
-- 'manual' is the column default.

create table if not exists project_ai_extractions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  developer_id uuid not null references developers(id) on delete cascade,
  source_file_name text not null,
  source_file_url text,
  -- { fieldName: { value, confidence: 0-100 } } -- one row per upload,
  -- not a per-field table: mirrors this codebase's own established
  -- jsonb-for-structured-subdata convention (projects.unit_type_prices,
  -- projects.payment_plan_details).
  extracted_fields jsonb not null default '{}',
  overall_confidence numeric,
  model text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id)
);
create index if not exists project_ai_extractions_project_id_idx on project_ai_extractions(project_id);

alter table project_ai_extractions enable row level security;

drop policy if exists "project_ai_extractions: developer reads own" on project_ai_extractions;
create policy "project_ai_extractions: developer reads own" on project_ai_extractions for select
  using (developer_id = (select developer_id from profiles where id = auth.uid()));

drop policy if exists "project_ai_extractions: admin reads all" on project_ai_extractions;
create policy "project_ai_extractions: admin reads all" on project_ai_extractions for select using (is_admin());

drop policy if exists "project_ai_extractions: admin updates all" on project_ai_extractions;
create policy "project_ai_extractions: admin updates all" on project_ai_extractions for update
  using (is_admin()) with check (is_admin());

-- Deliberately no insert policy -- only ever written by the extraction
-- API route's service-role client (createAdminClient()), same reasoning
-- already used for investment_leads (patch_147): this table records
-- what a server-side AI call produced, not something a client should
-- be able to forge rows into directly.

notify pgrst, 'reload schema';
