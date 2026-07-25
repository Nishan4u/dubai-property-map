-- Public visibility should require BOTH status in (published, featured)
-- AND approval_status = 'approved' — otherwise a developer's freshly
-- submitted project would be publicly visible before an admin reviews it.

drop policy if exists "projects: public read published" on projects;

create policy "projects: public read approved" on projects for select using (
  (status in ('published','featured') and approval_status = 'approved')
  or is_admin()
  or developer_id = (select developer_id from profiles where id = auth.uid())
);
