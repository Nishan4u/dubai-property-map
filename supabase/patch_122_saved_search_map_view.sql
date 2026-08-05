-- Save Map View (Module 5): a saved search can now optionally also
-- remember the map's own viewport (center/zoom/pitch/bearing) and which
-- amenity/heat layers were toggled on, so loading it puts the map back
-- exactly where it was, not just re-applies the filter criteria.
-- Nullable/additive -- every saved search created before this column
-- existed just has map_view = null and behaves exactly as it does today.
alter table saved_searches add column if not exists map_view jsonb;

notify pgrst, 'reload schema';
