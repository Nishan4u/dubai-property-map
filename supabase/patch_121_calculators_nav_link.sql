-- The header nav (nav_links, patch_19) never got a "Calculators" entry
-- when that hub page shipped, so it was reachable only by direct URL.
-- Idempotent: skips the insert if a Calculators header link already
-- exists (e.g. added by hand via /admin/menus since).
insert into nav_links (label, url, location, sort_order)
select 'Calculators', '/calculators', 'header', 6
where not exists (
  select 1 from nav_links where location = 'header' and url = '/calculators'
);

notify pgrst, 'reload schema';
