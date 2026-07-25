-- The core broker -> salesperson property-request workflow. request_id is
-- a sequence-backed default (REQ-000001, REQ-000002, ...) — race-safe,
-- no app-side generation logic needed.
--
-- Deliberately NO client_name / client_phone / client_email / client_whatsapp
-- / passport / Emirates ID columns anywhere on this table — brokers submit
-- their own contact details (already on file via `brokers`) plus the
-- property requirement only. This is the literal enforcement point for the
-- "client info is never collected" business rule.

create sequence property_request_seq start 1;

create table property_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique default ('REQ-' || lpad(nextval('property_request_seq')::text, 6, '0')),
  broker_id uuid not null references brokers(id) on delete restrict,
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
  broker_notes text,
  status text not null default 'new' check (status in (
    'new','broker_contacted','requirement_confirmed','units_shared','viewing_scheduled',
    'negotiation','booking','closed_won','on_hold','lost','cancelled'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index property_requests_broker_id_idx on property_requests(broker_id);
create index property_requests_developer_id_idx on property_requests(developer_id);
create index property_requests_salesperson_id_idx on property_requests(salesperson_id);

alter table property_requests enable row level security;
create policy "property_requests: broker inserts own" on property_requests for insert with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "property_requests: broker reads own" on property_requests for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "property_requests: salesperson reads assigned" on property_requests for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "property_requests: salesperson updates assigned" on property_requests for update using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
) with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "property_requests: developer reads own company requests" on property_requests for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "property_requests: developer reassigns own company requests" on property_requests for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "property_requests: admin manages all" on property_requests for all using (is_admin()) with check (is_admin());

create table property_request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references property_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);
alter table property_request_status_history enable row level security;
create policy "property_request_status_history: broker reads own request history" on property_request_status_history for select using (
  request_id in (select id from property_requests where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "property_request_status_history: salesperson reads assigned history" on property_request_status_history for select using (
  request_id in (select id from property_requests where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "property_request_status_history: developer reads own company history" on property_request_status_history for select using (
  request_id in (select id from property_requests where developer_id = (select developer_id from profiles where id = auth.uid()))
);
create policy "property_request_status_history: salesperson inserts for assigned" on property_request_status_history for insert with check (
  request_id in (select id from property_requests where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "property_request_status_history: developer inserts for own company" on property_request_status_history for insert with check (
  request_id in (select id from property_requests where developer_id = (select developer_id from profiles where id = auth.uid()))
);
create policy "property_request_status_history: admin manages all" on property_request_status_history for all using (is_admin()) with check (is_admin());

-- Per-notification delivery tracking (separate from the generic
-- email_logs table because this one also needs a salesperson_id link for
-- admin filtering by salesperson, and a "type" distinguishing the
-- salesperson-facing vs broker-facing email for the same request).
create table request_notifications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references property_requests(id) on delete cascade,
  salesperson_id uuid references salespersons(id) on delete set null,
  recipient_email text not null,
  type text not null check (type in ('salesperson_new_request','broker_confirmation')),
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempt_count int not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index request_notifications_request_id_idx on request_notifications(request_id);

alter table request_notifications enable row level security;
create policy "request_notifications: admin manages all" on request_notifications for all using (is_admin()) with check (is_admin());
-- No broker/salesperson-facing policy — written and read only by the
-- service-role property-request route and the admin Email Logs page.
