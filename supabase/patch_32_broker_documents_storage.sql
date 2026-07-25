-- Run this AFTER creating a bucket named "broker-documents" in the
-- Supabase dashboard (Storage -> New bucket -> name: broker-documents ->
-- Public bucket: OFF). Unlike project-media (public, used for anything
-- meant to be publicly displayed), RERA cards are identity documents and
-- must only ever be readable by their owner or an admin.
-- Path convention: broker-documents/{broker_id}/rera-card/{timestamp}-{name}

create policy "broker-documents: owner reads own"
  on storage.objects for select
  using (
    bucket_id = 'broker-documents'
    and (storage.foldername(name))[1]::uuid = (select broker_id from profiles where id = auth.uid())
  );

create policy "broker-documents: owner uploads own"
  on storage.objects for insert
  with check (
    bucket_id = 'broker-documents'
    and (storage.foldername(name))[1]::uuid = (select broker_id from profiles where id = auth.uid())
  );

create policy "broker-documents: owner replaces own"
  on storage.objects for update
  using (
    bucket_id = 'broker-documents'
    and (storage.foldername(name))[1]::uuid = (select broker_id from profiles where id = auth.uid())
  );

create policy "broker-documents: admin reads all"
  on storage.objects for select
  using (bucket_id = 'broker-documents' and is_admin());

-- Broker/salesperson profile photos reuse the existing public
-- "project-media" bucket (patch_6) under new path prefixes:
--   project-media/broker-photos/{broker_id}/{timestamp}-{name}
--   project-media/salesperson-photos/{salesperson_id}/{timestamp}-{name}
-- The bucket-wide "project-media: public read" policy from patch_6
-- already covers reading these — only insert/update policies are new here.

create policy "project-media: broker uploads own photo"
  on storage.objects for insert
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'broker-photos'
    and (storage.foldername(name))[2]::uuid = (select broker_id from profiles where id = auth.uid())
  );

create policy "project-media: broker replaces own photo"
  on storage.objects for update
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'broker-photos'
    and (storage.foldername(name))[2]::uuid = (select broker_id from profiles where id = auth.uid())
  );

create policy "project-media: developer uploads own salesperson photo"
  on storage.objects for insert
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'salesperson-photos'
    and (storage.foldername(name))[2]::uuid in (
      select id from salespersons where developer_id = (select developer_id from profiles where id = auth.uid())
    )
  );

create policy "project-media: salesperson replaces own photo"
  on storage.objects for update
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = 'salesperson-photos'
    and (storage.foldername(name))[2]::uuid = (select salesperson_id from profiles where id = auth.uid())
  );

create policy "project-media: admin manages broker/salesperson photos"
  on storage.objects for all
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] in ('broker-photos','salesperson-photos')
    and is_admin()
  )
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] in ('broker-photos','salesperson-photos')
    and is_admin()
  );
