-- patch_26 only let a developer manage their OWN logo (path check against
-- their own profiles.developer_id). Admins need to be able to upload/replace/
-- delete the logo for ANY developer from the admin panel, so add matching
-- admin-bypass policies on the same developer-logos/ path prefix.

create policy "project-media: admin uploads any developer logo"
  on storage.objects for insert
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'developer-logos'
    and is_admin()
  );

create policy "project-media: admin replaces any developer logo"
  on storage.objects for update
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'developer-logos'
    and is_admin()
  );

create policy "project-media: admin deletes any developer logo"
  on storage.objects for delete
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'developer-logos'
    and is_admin()
  );
