-- Lets admin upload a real designed banner image for ad_placements rows
-- (Homepage/Sidebar/Community/Project/Developer banners) instead of only
-- the plain "Sponsored <title>" text strip every placement has rendered
-- as until now. Nullable/additive -- every existing row and every render
-- site already falls back to the text-only version when this is empty.
alter table ad_placements add column if not exists image_url text;

notify pgrst, 'reload schema';
