-- All Projects filters (spec section 15) ask for "Furnishing" -- unlike
-- "Completion Status" (already derivable from listing_type + handover_year
-- via getProjectStatusLabel(), no schema change needed), furnishing has no
-- existing field anywhere. Nullable since most existing projects won't
-- have it set yet; admin/developer set it per-project going forward.
alter table projects add column if not exists furnishing text
  check (furnishing in ('furnished', 'unfurnished', 'semi_furnished'));

notify pgrst, 'reload schema';
