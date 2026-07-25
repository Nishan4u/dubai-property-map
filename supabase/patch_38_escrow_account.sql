-- Optional Escrow Account status a developer can set per project when
-- adding/editing it. Left null when the developer doesn't specify one —
-- the Search & Filters "Escrow Account" filter treats null as "All" only,
-- never as a positive match for "Not Available".
alter table projects
  add column if not exists escrow_status text check (escrow_status in ('available', 'not_available'));
