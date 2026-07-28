-- patch_62 added a second permissive UPDATE policy for developers
-- ("disconnects own roster") alongside patch_30's existing one ("updates
-- own roster"). Both share the same USING clause, and Postgres requires
-- ALL policies whose USING matches a row to ALSO pass their own WITH
-- CHECK -- so the two clauses ("must stay the same developer_id" AND
-- "must become null") contradicted each other and blocked every update,
-- confirmed live: a developer could edit job_title but could not
-- disconnect (RLS violation) or reassign. Merging into a single policy
-- with one combined WITH CHECK fixes this.
drop policy if exists "salespersons: developer updates own roster" on salespersons;
drop policy if exists "salespersons: developer disconnects own roster" on salespersons;

create policy "salespersons: developer updates own roster" on salespersons for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
  or developer_id is null
);
