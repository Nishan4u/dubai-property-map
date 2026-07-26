-- Mirrors the broker enforcement (api/broker/property-requests requires
-- subscription_status = 'active' before a broker can submit a request) —
-- a salesperson without an active (or complimentary) subscription can no
-- longer respond to/update leads assigned to them. Reading what's assigned
-- stays open (an incentive to subscribe, not a hard wall on visibility).
drop policy if exists "property_requests: salesperson updates assigned" on property_requests;
create policy "property_requests: salesperson updates assigned" on property_requests for update using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
  and exists (
    select 1 from salespersons s
    where s.id = (select salesperson_id from profiles where id = auth.uid())
      and (s.subscription_status = 'active' or s.is_complimentary)
  )
) with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
