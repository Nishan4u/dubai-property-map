-- Broker Agency: own, separate Property Request feature (spec section 10).
-- Deliberately a distinct table from property_requests, not a broker_id-
-- nullable variant of it -- the whole point is that an agency's own
-- requests are never mixed with, or visible alongside, any individual
-- broker's requests/clients/leads. Mirrors property_requests' shape and
-- notification pattern, minus the broker-specific fields.

create sequence agency_property_request_seq start 1;

create table agency_property_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique default ('AREQ-' || lpad(nextval('agency_property_request_seq')::text, 6, '0')),
  brokerage_id uuid not null references brokerages(id) on delete restrict,
  developer_id uuid not null references developers(id) on delete restrict,
  salesperson_id uuid not null references salespersons(id) on delete restrict,
  project_id uuid not null references projects(id) on delete restrict,
  property_type text not null,
  bedrooms text,
  budget_min numeric,
  budget_max numeric,
  purchase_purpose text,
  financing text,
  purchase_timeline text,
  preferred_unit text,
  agency_notes text,
  status text not null default 'new' check (status in (
    'new','broker_contacted','requirement_confirmed','units_shared','viewing_scheduled',
    'negotiation','booking','closed_won','on_hold','lost','cancelled'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index agency_property_requests_brokerage_id_idx on agency_property_requests(brokerage_id);
create index agency_property_requests_developer_id_idx on agency_property_requests(developer_id);
create index agency_property_requests_salesperson_id_idx on agency_property_requests(salesperson_id);

alter table agency_property_requests enable row level security;

create policy "agency_property_requests: agency inserts own" on agency_property_requests for insert with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
create policy "agency_property_requests: agency reads own" on agency_property_requests for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
create policy "agency_property_requests: salesperson reads assigned" on agency_property_requests for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "agency_property_requests: salesperson updates assigned" on agency_property_requests for update using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
) with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "agency_property_requests: developer reads own" on agency_property_requests for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "agency_property_requests: admin manages all" on agency_property_requests for all using (
  is_admin()
) with check (
  is_admin()
);

notify pgrst, 'reload schema';
