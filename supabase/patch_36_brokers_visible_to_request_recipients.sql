-- patch_30/35 gave brokers RLS "owner reads own" + "admin manages all" only
-- — no salesperson or developer could ever read a broker's contact details,
-- even for a broker who submitted a request directly to them. Spec sections
-- 26 ("Broker Profile Visible to Salesperson") and 30 ("Developer Lead
-- Section" showing the Broker column) both require this. Confirmed live:
-- the embedded `brokers(...)` select in the salesperson "My Leads" page and
-- the developer "Property Requests" page silently returned null broker
-- info (rendered as "—") without this.

create policy "brokers: salesperson reads assigned request brokers" on brokers for select using (
  id in (
    select broker_id from property_requests
    where salesperson_id = (select salesperson_id from profiles where id = auth.uid())
  )
);

create policy "brokers: developer reads own company request brokers" on brokers for select using (
  id in (
    select broker_id from property_requests
    where developer_id = (select developer_id from profiles where id = auth.uid())
  )
);
