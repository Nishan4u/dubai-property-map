-- Part 2 of 2 -- run this ONLY after patch_82's get_viewer_map_access_status()
-- has been verified against real accounts of every role (buyer, admin,
-- developer, broker active/expired/none, salesperson, broker_agency,
-- guest) to return the exact same status getMapAccessStatus() does in the
-- app. This is the actual behavior change: swaps the "anyone can read a
-- published project" branch for one that requires an authorized viewer.
-- Owner (developer manages own) and admin access are untouched.
drop policy if exists "projects: public read approved" on projects;

create policy "projects: authorized read approved" on projects for select using (
  (status in ('published', 'featured') and approval_status = 'approved' and public.get_viewer_map_access_status() = 'ok')
  or is_admin()
  or developer_id = (select developer_id from profiles where id = auth.uid())
);
