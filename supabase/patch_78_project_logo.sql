-- Project-level logo (spec section 8: "Project Logo") -- separate from the
-- existing developer-level logo_url, since a developer can have many
-- projects each with their own branding, shown on Card/Details/Map
-- popup/Search results/Upcoming pin popup.
alter table projects
  add column if not exists logo_url text;

notify pgrst, 'reload schema';
