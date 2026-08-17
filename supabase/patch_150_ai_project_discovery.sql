-- AI Project Discovery -- a recurring, external (Anthropic-cloud) job
-- researches genuinely new Dubai real-estate project announcements and
-- POSTs structured candidates to a new secret-authenticated ingest
-- route. This patch adds the columns that route needs to record where
-- an extraction came from, and the platform_settings this feature is
-- tuned through -- including a default-OFF kill switch, so nothing
-- auto-publishes until an admin explicitly opts in from /admin/settings
-- after confirming the recurring job actually works.

alter table project_ai_extractions add column if not exists source_type text not null default 'brochure_upload'
  check (source_type in ('brochure_upload', 'web_discovery'));
-- Every existing patch_149 row is a brochure upload -- the default
-- backfills them correctly with zero data migration needed.

alter table project_ai_extractions add column if not exists source_urls text[] not null default '{}';
-- Citation URLs the discovery agent actually retrieved content from.
-- Empty for brochure_upload rows (source_file_url already covers that
-- case). App-layer validation requires >=1 real URL for any
-- web_discovery row -- this is the entire justification for trusting
-- an unreviewed auto-publish at all.

alter table project_ai_extractions add column if not exists auto_published boolean not null default false;
-- True only when the ingest route itself decided to publish -- distinct
-- from `status`/`reviewed_by`/`reviewed_at`, which track human review
-- and stay untouched either way (nothing anywhere sets `status:
-- 'reviewed'` today -- not invented here either).

alter table projects add column if not exists ai_source_type text
  check (ai_source_type in ('brochure_upload', 'web_discovery'));
-- Public-readable disclosure marker, nullable, set only alongside
-- data_source = 'ai_extracted'. Deliberately its own column rather than
-- widening data_source's enum (a closed 2-value union read in exactly
-- one live comparison today -- widening it would mean a backfill of
-- every patch_149 row for no benefit) and rather than reading
-- project_ai_extractions directly on the public page (that table's RLS
-- has no anonymous-read policy at all, by design -- adding one just for
-- this would expose confidence/extracted_fields to every visitor).

insert into platform_settings (key, label, value) values
  ('ai_discovery_enabled', 'AI Project Discovery Enabled', 'false'),
  ('ai_discovery_confidence_threshold', 'AI Discovery Auto-Publish Confidence Threshold (%)', '85'),
  ('ai_discovery_max_batch_size', 'AI Discovery Max Projects Per Ingest Run', '15')
on conflict (key) do nothing;
-- ai_discovery_enabled ships DISABLED. The code/schema go live in a
-- normal deploy; nothing auto-publishes until an admin flips this to
-- 'true' from the existing /admin/settings page (zero new UI) after
-- confirming the cloud routine actually works. The single biggest
-- concrete guardrail here -- a kill switch needing no deploy/secret
-- rotation to use.
-- Threshold defaults stricter (85) than AiExtractionBanner's existing
-- LOW_CONFIDENCE_THRESHOLD (75, which only flags a field for human
-- double-checking) -- skipping review entirely should demand more.

notify pgrst, 'reload schema';
