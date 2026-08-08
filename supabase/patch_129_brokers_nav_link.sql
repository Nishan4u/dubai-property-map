-- The site's header/footer nav is entirely admin-managed via nav_links
-- (patch_19, editable at /admin/menus) -- both PublicShell.tsx (every
-- page except the homepage) and SiteHeader.tsx (homepage) read real rows
-- from this table, never a hardcoded list. "Brokers" was never added as a
-- row when the Broker Directory module shipped, which is why it didn't
-- appear in the main menu despite the page existing at /brokers.
-- Purely additive -- doesn't touch any existing row's sort_order.
insert into nav_links (label, url, location, sort_order)
select 'Brokers', '/brokers', 'header', 8
where not exists (
  select 1 from nav_links where location = 'header' and url = '/brokers'
);

notify pgrst, 'reload schema';
