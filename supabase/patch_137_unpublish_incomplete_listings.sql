-- Found while investigating an AdSense rejection ("insufficient content" /
-- "under construction" are the two most likely policy matches): 8 published,
-- approved, publicly-live project listings under developer "Beyond" (Aria,
-- Kanyon, Orise, Passo, Saria, Sensia, Soulever, The Mural, The Pad -- all
-- in Dubai Maritime City) have essentially no real data -- AED 0 starting
-- price, 0 bedrooms, no amenities, no photos, no description, "0" handover.
-- Confirmed live on production (e.g. /projects/aria-beyond shows "Starting
-- From AED 0" and "0 BR"). These also cross-link to each other via "Similar
-- Projects Nearby", so a visitor hitting any one of the 14 real Dubai
-- Maritime City-adjacent pages can click through into several of these
-- broken-looking pages in a row.
--
-- This sets them back to 'draft' (NOT deleted -- all their real column
-- data, such as it is, is preserved) so they stop being publicly
-- crawlable/visible until real price/bedroom/photo/description data is
-- filled in for them, matching how every other incomplete project on this
-- platform already behaves before a developer/admin publishes it.
--
-- Also included: 4 rows that already read as internal test/QA artifacts
-- (names "a", "da", "dada", and "QA Milestone Test Project") -- these are
-- currently harmless (approval_status is still 'pending' for all four, so
-- getPublishedProjects()'s own status filter already keeps them off every
-- public listing page and their direct URLs 404), but flipping their
-- status to 'draft' too is a small, free tidy-up with zero risk since nothing
-- public depends on their current 'published' status.
--
-- Idempotent: safe to re-run, only touches rows still in this specific
-- state (won't touch anything an admin has since edited/republished).

update projects
set status = 'draft'
where slug in (
  'aria-beyond', 'kanyon-beyond', 'orise-beyond', 'passo-beyond',
  'saria-beyond', 'sensia-beyond', 'soulever-beyond', 'the-mural-beyond'
)
and status = 'published'
and price_from_aed = 0;

update projects
set status = 'draft'
where slug in ('a-8jpv4', 'da-aiyev', 'dada-yznhy', 'qa-milestone-test-project-x8ze1')
and status = 'published'
and approval_status = 'pending';

notify pgrst, 'reload schema';
