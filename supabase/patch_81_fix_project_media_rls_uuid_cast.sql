-- Fixes a pre-existing production bug (found while building spec section 13,
-- which reuses the developer-logos/ storage prefix): patch_6's two
-- "developer manages own project" policies unconditionally cast the FIRST
-- path segment to uuid --
--   (storage.foldername(name))[1]::uuid in (select id from projects ...)
-- For any object whose first segment isn't project-id-shaped (e.g. the
-- developer-logos/... or blog-images/... prefixes added later in patch_26
-- and patch_27), this cast throws "invalid input syntax for type uuid"
-- and aborts the WHOLE insert/delete -- even though a different, more
-- specific permissive policy would otherwise have allowed it. Confirmed via
-- a live test: a developer's own company-logo upload (an already-shipped,
-- unrelated feature) currently fails outright because of this.
--
-- Fix: guard the cast with a regex check first so non-project paths make
-- this policy simply evaluate to false (as intended) instead of erroring.
drop policy if exists "project-media: developer uploads to own project" on storage.objects;
drop policy if exists "project-media: developer deletes own project files" on storage.objects;

create policy "project-media: developer uploads to own project"
  on storage.objects for insert
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and (storage.foldername(name))[1]::uuid in (
      select id from projects
      where developer_id = (select developer_id from profiles where id = auth.uid())
    )
  );

create policy "project-media: developer deletes own project files"
  on storage.objects for delete
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and (storage.foldername(name))[1]::uuid in (
      select id from projects
      where developer_id = (select developer_id from profiles where id = auth.uid())
    )
  );
