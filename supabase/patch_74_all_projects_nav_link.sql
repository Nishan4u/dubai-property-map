-- New All Projects page (spec section 15) needs a way to be discovered —
-- add it to the header nav, right after Communities. nav_links has no
-- unique constraint beyond its id, so guard against a double-run with an
-- explicit existence check rather than "on conflict" (which would never
-- fire here and could insert duplicates).
do $$
begin
  if not exists (select 1 from nav_links where location = 'header' and url = '/projects') then
    -- Shift existing header links after Communities (sort_order 2) down by
    -- one so All Projects lands between Communities and whatever came next.
    update nav_links set sort_order = sort_order + 1
    where location = 'header' and sort_order >= 3;

    insert into nav_links (label, url, location, sort_order) values
      ('All Projects', '/projects', 'header', 3);
  end if;
end $$;
