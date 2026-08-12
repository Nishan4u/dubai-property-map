-- Private / Team / Presentation visibility tiers on broker_listings.
--
-- Today broker_listings only has two state columns: availability_status
-- (market status) and moderation_status (admin review gate). There is no
-- tier between "only the owner can see it" and "the whole internet can
-- see it once approved" -- this patch adds one.
--
-- visibility defaults to 'public' (NOT 'private') so every existing,
-- already-approved listing keeps behaving exactly as it does today the
-- moment this migration lands -- no existing live listing silently
-- disappears from the public directory.
alter table broker_listings add column if not exists visibility text not null default 'public';
alter table broker_listings drop constraint if exists broker_listings_visibility_check;
alter table broker_listings add constraint broker_listings_visibility_check
  check (visibility in ('private', 'team', 'presentation', 'public'));

-- Widen the existing public-read policy to also allow the 'presentation'
-- tier (unlisted direct-link only -- the app-code grid/directory queries
-- separately narrow back down to 'public' only, since RLS alone can't
-- distinguish "browsing the grid" from "fetching one known slug"). Rows
-- with visibility 'private' or 'team' are excluded from this policy
-- entirely, same as an unapproved listing is excluded today.
drop policy if exists "broker_listings: public reads approved" on broker_listings;
create policy "broker_listings: public reads approved" on broker_listings for select using (
  moderation_status = 'approved' and visibility in ('public', 'presentation')
);

-- New: the first broker-reads-another-broker's-row policy in this schema.
-- Scoped to same brokerage_id, independent of moderation_status (internal
-- office sharing doesn't need to wait on admin review -- it never reaches
-- the public internet). brokerage_id is null for independent brokers, so
-- two null brokerage_ids never match each other (NULL = NULL is not true
-- in SQL) -- independent brokers simply never satisfy this policy.
drop policy if exists "broker_listings: team reads teammates" on broker_listings;
create policy "broker_listings: team reads teammates" on broker_listings for select using (
  visibility = 'team'
  and broker_id in (
    select id from brokers
    where brokerage_id is not null
      and brokerage_id = (
        select brokerage_id from brokers
        where id = (select broker_id from profiles where id = auth.uid())
      )
  )
);

-- Existing owner-full-CRUD and admin-full-CRUD policies are untouched --
-- visibility never restricts what the owner or an admin can do with
-- their/any row.

notify pgrst, 'reload schema';
