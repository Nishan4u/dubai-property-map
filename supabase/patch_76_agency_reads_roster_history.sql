-- Found via live testing: the new agency-side broker profile page's
-- "Agency History" section always showed empty, even with real history
-- rows on file -- broker_agency_history (patch_60) only had read policies
-- for the broker themselves and admin, never the agency reading history
-- for brokers currently on its own roster.
create policy "broker_agency_history: agency reads own roster history" on broker_agency_history for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);

notify pgrst, 'reload schema';
