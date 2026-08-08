-- Building Age (Years) for Ready projects -- only meaningful for
-- listing_type = 'ready' (an off-plan project has no age yet), so this is
-- a plain nullable column, not required/defaulted. Search & Filters gets a
-- matching "Building Age" filter (see FilterSidebar.tsx).

alter table projects add column if not exists building_age_years int;

notify pgrst, 'reload schema';
