-- Exact per-project pin locations (previously only communities had coordinates,
-- so every project in a community stacked on one pin).
alter table projects add column lat numeric;
alter table projects add column lng numeric;

-- Real video / virtual tour link storage (developer-editable).
alter table projects add column video_url text;
alter table projects add column virtual_tour_url text;

-- Seed existing projects with a real-ish location: their community's center
-- plus a small random offset so each property gets a distinct nearby pin
-- instead of stacking exactly on top of each other.
update projects p
set
  lat = c.lat + (random() - 0.5) * 0.012,
  lng = c.lng + (random() - 0.5) * 0.012
from communities c
where p.community_id = c.id
  and p.lat is null;
