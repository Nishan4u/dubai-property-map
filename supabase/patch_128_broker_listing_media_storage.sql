-- Run this AFTER creating a bucket named "broker-listing-media" in the
-- Supabase dashboard (Storage -> New bucket -> name: broker-listing-media
-- -> Public bucket: ON). Mirrors patch_6's project-media bucket exactly.
-- Path convention:
--   broker-listing-media/{listing_id}/gallery/{timestamp}-{name}
--   broker-listing-media/{listing_id}/floor-plans/{timestamp}-{name}

create policy "broker-listing-media: public read"
  on storage.objects for select
  using (bucket_id = 'broker-listing-media');

create policy "broker-listing-media: broker uploads to own listing"
  on storage.objects for insert
  with check (
    bucket_id = 'broker-listing-media'
    and (storage.foldername(name))[1]::uuid in (
      select id from broker_listings
      where broker_id = (select broker_id from profiles where id = auth.uid())
    )
  );

create policy "broker-listing-media: broker deletes own listing files"
  on storage.objects for delete
  using (
    bucket_id = 'broker-listing-media'
    and (storage.foldername(name))[1]::uuid in (
      select id from broker_listings
      where broker_id = (select broker_id from profiles where id = auth.uid())
    )
  );

create policy "broker-listing-media: admin manages all"
  on storage.objects for all
  using (bucket_id = 'broker-listing-media' and is_admin())
  with check (bucket_id = 'broker-listing-media' and is_admin());
