-- Adds a real logo image field for developers (used by the homepage
-- "Our Partner Developers" logo slider) and lets developers upload their own
-- logo to the existing project-media storage bucket under
-- developer-logos/{developer_id}/... — same bucket used for project photos,
-- just a different path prefix.

alter table developers
  add column if not exists logo_url text;

create policy "project-media: developer uploads own logo"
  on storage.objects for insert
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'developer-logos'
    and (storage.foldername(name))[2]::uuid = (
      select developer_id from profiles where id = auth.uid()
    )
  );

create policy "project-media: developer replaces own logo"
  on storage.objects for update
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'developer-logos'
    and (storage.foldername(name))[2]::uuid = (
      select developer_id from profiles where id = auth.uid()
    )
  );

create policy "project-media: developer deletes own logo"
  on storage.objects for delete
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'developer-logos'
    and (storage.foldername(name))[2]::uuid = (
      select developer_id from profiles where id = auth.uid()
    )
  );
