-- Found via live testing: the agency's own Property Request form showed
-- "This developer has no active salespersons yet" for every developer,
-- even ones with active salespersons -- because the existing
-- "salespersons: broker reads active roster" RLS policy (patch_30) only
-- allows role = 'broker' to read, not 'broker_agency'. Mirrors that policy
-- for the new role.
create policy "salespersons: broker agency reads active roster" on salespersons for select using (
  status = 'active'
  and exists (select 1 from profiles where id = auth.uid() and role = 'broker_agency')
);

notify pgrst, 'reload schema';
