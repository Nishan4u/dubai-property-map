-- Run this AFTER creating a bucket named "project-media" in the Supabase
-- dashboard (Storage -> New bucket -> name: project-media -> Public bucket: ON).
-- Files are stored as project-media/{project_id}/gallery/... or
-- project-media/{project_id}/documents/... — the first path segment is the
-- project_id, which we use to check ownership against the projects table.

create policy "project-media: public read"
  on storage.objects for select
  using (bucket_id = 'project-media');

create policy "project-media: developer uploads to own project"
  on storage.objects for insert
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1]::uuid in (
      select id from projects
      where developer_id = (select developer_id from profiles where id = auth.uid())
    )
  );

create policy "project-media: developer deletes own project files"
  on storage.objects for delete
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1]::uuid in (
      select id from projects
      where developer_id = (select developer_id from profiles where id = auth.uid())
    )
  );
