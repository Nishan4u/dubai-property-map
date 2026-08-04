-- Broker Agency profile picture: brokerages had no photo/logo column at
-- all (unlike developers.logo_url / brokers.photo_url), so the agency's
-- own profile page (src/app/broker-agency/profile/page.tsx) was purely a
-- read-only text table with nothing to upload a picture to.
alter table brokerages add column if not exists logo_url text;

notify pgrst, 'reload schema';
