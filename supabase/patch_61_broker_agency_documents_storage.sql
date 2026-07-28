-- The broker-documents bucket's existing policies (patch_32) only ever
-- checked profiles.broker_id, so a broker agency uploading its own
-- license to broker-documents/{agency_id}/license/... was rejected by
-- RLS even after the bucket itself was created. Mirrors patch_32's
-- pattern exactly, keyed on broker_agency_id instead.
-- Path convention: broker-documents/{agency_id}/license/{timestamp}-{name}

create policy "broker-documents: agency reads own license"
  on storage.objects for select
  using (
    bucket_id = 'broker-documents'
    and (storage.foldername(name))[1]::uuid = (select broker_agency_id from profiles where id = auth.uid())
  );

create policy "broker-documents: agency uploads own license"
  on storage.objects for insert
  with check (
    bucket_id = 'broker-documents'
    and (storage.foldername(name))[1]::uuid = (select broker_agency_id from profiles where id = auth.uid())
  );

create policy "broker-documents: agency replaces own license"
  on storage.objects for update
  using (
    bucket_id = 'broker-documents'
    and (storage.foldername(name))[1]::uuid = (select broker_agency_id from profiles where id = auth.uid())
  );
