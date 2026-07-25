-- brochure_downloads only let the downloading user read their own row.
-- Developers need to see download counts for their own projects too, for
-- real Analytics/Dashboard "Downloads" stats.
create policy "brochure_downloads: developer reads own project downloads" on brochure_downloads for select using (
  project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid()))
);
create policy "brochure_downloads: admin reads all" on brochure_downloads for select using (is_admin());
