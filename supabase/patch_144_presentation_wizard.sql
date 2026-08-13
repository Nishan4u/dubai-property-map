-- Guided "Create Presentation" wizard + Luxury presentation mode.
--
-- 1. selected_unit_type_ids: lets a collection item optionally restrict
--    which of a project's unit types show on the public presentation.
--    null/empty = show every unit type, identical to today's only
--    existing behavior -- every existing row, and every row the plain
--    "New Collection" form creates going forward (it never sets this
--    column), keeps behaving exactly as it does today.
alter table crm_collection_items add column if not exists selected_unit_type_ids uuid[];

-- 2. Widen the presentation mode enum (patch_141) to add 'luxury'.
alter table crm_collections drop constraint if exists crm_collections_mode_check;
alter table crm_collections add constraint crm_collections_mode_check
  check (mode in ('default', 'investor', 'end_user', 'quick_pitch', 'luxury'));

notify pgrst, 'reload schema';
