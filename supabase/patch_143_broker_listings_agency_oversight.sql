-- Broker-agency oversight of broker_listings.
--
-- Lets a broker-agency (parent account) see the Team/Presentation/Public
-- tier listings of every broker in its own agency -- NOT 'private' tier,
-- which stays visible only to the owning broker + admin (an explicit
-- product decision, not an oversight: the agency has no way to even
-- learn a private listing exists, by design).
--
-- No new column needed -- visibility already exists from patch_142.
-- This is a single new read policy, mirroring
-- "broker_listings: team reads teammates" (patch_142) but scoped by
-- brokerage_id = profiles.broker_agency_id instead of same-brokerage
-- peer matching. Independent of moderation_status, same reasoning as
-- the team-tier policy: this is an internal audience, not the public
-- internet, so it shouldn't have to wait on admin review either.
drop policy if exists "broker_listings: agency reads own agency's" on broker_listings;
create policy "broker_listings: agency reads own agency's" on broker_listings for select using (
  visibility <> 'private'
  and broker_id in (
    select id from brokers
    where brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
  )
);

-- Every existing policy on broker_listings (owner-full-CRUD, admin-
-- full-CRUD, public-reads-approved, team-reads-teammates) is untouched
-- -- this adds a third read audience, nothing more.

notify pgrst, 'reload schema';
