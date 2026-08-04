-- Storage (Module 15 "Other Integrations" -> Storage): an opt-in, one-way
-- media backup a developer can point at their own Amazon S3 bucket.
-- Deliberately additive, not a replacement -- Supabase Storage (the
-- "project-media" bucket) stays the one and only storage backend every
-- existing upload flow (ProjectFileManager.tsx and friends) reads from and
-- writes to, completely untouched. This table just remembers one S3
-- connection per developer so an on-demand sync (src/lib/storageSync.ts)
-- can mirror their already-uploaded gallery images and documents into it.
--
-- access_key_id/secret_access_key are stored in plaintext, same tradeoff
-- as crm_integrations.secret (patch_111) -- both need to be read back and
-- reused by the system itself, not just verified once. Developers should
-- use IAM credentials scoped to only this one bucket (least privilege),
-- not their AWS root/account-wide keys.
--
-- Every statement is safely re-runnable, per the patch_104 lesson.

create table if not exists storage_connections (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null unique references developers(id) on delete cascade,
  bucket_name text not null,
  region text not null,
  access_key_id text not null,
  secret_access_key text not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  last_synced_at timestamptz,
  last_sync_file_count int,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table storage_connections enable row level security;

drop policy if exists "storage_connections: developer selects own" on storage_connections;
create policy "storage_connections: developer selects own" on storage_connections for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "storage_connections: developer inserts own" on storage_connections;
create policy "storage_connections: developer inserts own" on storage_connections for insert with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "storage_connections: developer updates own" on storage_connections;
create policy "storage_connections: developer updates own" on storage_connections for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "storage_connections: developer deletes own" on storage_connections;
create policy "storage_connections: developer deletes own" on storage_connections for delete using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);

-- Select-only for admin, deliberately not "for all" -- oversight, not
-- ownership, matching crm_integrations' own admin policy precedent.
drop policy if exists "storage_connections: admin reads all" on storage_connections;
create policy "storage_connections: admin reads all" on storage_connections for select using (is_admin());

notify pgrst, 'reload schema';
