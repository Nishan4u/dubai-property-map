-- Developer Embeddable Map Widget: lets a developer embed a live map of
-- their own projects on their own external website via <iframe
-- src="https://dubaipropertymap.ae/embed/developer/{slug}">. No new table
-- needed for the widget's data -- it reads from the already public-safe
-- `projects_public_meta` view (patch_82/87) and the already-public
-- `developers` table, exactly like the public developer profile page.
-- This patch only adds a simple, best-effort view counter so the
-- developer's dashboard can show "Embed Views" -- mirrors
-- increment_project_views (patch_17) exactly.

alter table developers add column if not exists embed_views int not null default 0;

create or replace function increment_developer_embed_views(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update developers set embed_views = embed_views + 1 where id = p_id;
$$;

grant execute on function increment_developer_embed_views(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
