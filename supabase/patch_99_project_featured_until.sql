-- Self-serve "Feature My Project" for developers: a flat AED 50 / 15-day
-- boost, paid directly via Stripe, no subscription plan required (matches
-- the new "developers get free/unlimited listing, only pay for featuring"
-- model -- the existing Global Free Access "Developer" toggle already
-- covers the listing-limit side, see patch_88).
--
-- projects.featured (schema.sql) already drives the homepage Featured
-- carousel (HomeClient.tsx: `p.featured`) and is otherwise admin-set,
-- indefinitely, with no expiry concept -- this column is additive and
-- purely optional: null means "no expiry" (preserves every existing
-- admin-set featured project's behavior exactly as it is today), a real
-- timestamp means "this specific featured run expires then." The actual
-- expiry check happens at read time in src/lib/supabase/mappers.ts,
-- mirroring how ad_placements (patch_9) already expires by date range
-- rather than a background job flipping status -- there's no job
-- scheduler in this codebase to physically revert the boolean.
alter table projects add column if not exists featured_until timestamptz;

notify pgrst, 'reload schema';
