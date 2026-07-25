-- The "Total Views" stat was a static seeded number — nothing ever
-- incremented it. This adds a safe public RPC so real page visits count.

create or replace function increment_project_views(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update projects set views = views + 1 where id = p_id;
$$;

grant execute on function increment_project_views(uuid) to anon, authenticated;
