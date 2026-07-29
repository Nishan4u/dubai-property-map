-- Representative photo per unit type (distinct from floor plans, which are
-- technical drawings) -- requested alongside the existing unit type fields.
alter table project_unit_types
  add column if not exists image_url text;

notify pgrst, 'reload schema';
