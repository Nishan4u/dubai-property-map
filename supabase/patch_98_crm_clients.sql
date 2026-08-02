-- Built-in CRM (Module 15): Client Management + Notes + Tasks, layered on
-- top of the existing property_requests pipeline rather than replacing it.
--
-- patch_35's own comment states property_requests deliberately has no
-- client_name/phone/email columns -- "the literal enforcement point for
-- the 'client info is never collected' business rule." That rule is being
-- relaxed now (explicitly approved): brokers/salespersons can track real
-- client contact info, but it lives here on its own table, linked to a
-- request only via an opaque client_id -- property_requests itself still
-- carries no PII columns directly, so patch_35's own literal wording still
-- holds; only the new join makes contact info reachable, and only to the
-- request's own owner.

create table crm_clients (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('broker', 'salesperson')),
  broker_id uuid references brokers(id) on delete cascade,
  salesperson_id uuid references salespersons(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  whatsapp text,
  source text check (source in ('property_request', 'referral', 'walk_in', 'website', 'other')),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_clients_owner_match check (
    (owner_type = 'broker' and broker_id is not null and salesperson_id is null)
    or (owner_type = 'salesperson' and salesperson_id is not null and broker_id is null)
  )
);
create index crm_clients_broker_id_idx on crm_clients(broker_id) where broker_id is not null;
create index crm_clients_salesperson_id_idx on crm_clients(salesperson_id) where salesperson_id is not null;

alter table crm_clients enable row level security;
create policy "crm_clients: broker selects own" on crm_clients for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "crm_clients: broker inserts own" on crm_clients for insert with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "crm_clients: broker updates own" on crm_clients for update using (
  broker_id = (select broker_id from profiles where id = auth.uid())
) with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "crm_clients: broker deletes own" on crm_clients for delete using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "crm_clients: salesperson selects own" on crm_clients for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "crm_clients: salesperson inserts own" on crm_clients for insert with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "crm_clients: salesperson updates own" on crm_clients for update using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
) with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "crm_clients: salesperson deletes own" on crm_clients for delete using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
-- Select-only for admin, deliberately not "for all" -- a broker/
-- salesperson's own client list is their private data; admin gets support/
-- oversight visibility, not a backdoor to edit or delete it.
create policy "crm_clients: admin reads all" on crm_clients for select using (is_admin());

-- Nullable, additive -- existing requests keep client_id null and behave
-- exactly as before. `on delete set null` so deleting a client never takes
-- the request history down with it.
alter table property_requests add column if not exists client_id uuid references crm_clients(id) on delete set null;
create index if not exists property_requests_client_id_idx on property_requests(client_id) where client_id is not null;

-- crm_notes / crm_tasks deliberately carry no broker_id/salesperson_id of
-- their own -- a bare FK there could drift from the linked client/
-- request's actual owner (e.g. a broker inserting a note against another
-- broker's client). Ownership is derived via the same EXISTS-over-
-- property_requests shape property_request_status_history (patch_35)
-- already uses, just extended to also check crm_clients.
create table crm_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references crm_clients(id) on delete cascade,
  request_id uuid references property_requests(id) on delete cascade,
  body text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  constraint crm_notes_linked_to_something check (client_id is not null or request_id is not null)
);
create index crm_notes_client_id_idx on crm_notes(client_id) where client_id is not null;
create index crm_notes_request_id_idx on crm_notes(request_id) where request_id is not null;

alter table crm_notes enable row level security;
create policy "crm_notes: broker reads own" on crm_notes for select using (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "crm_notes: broker inserts own" on crm_notes for insert with check (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "crm_notes: salesperson reads own" on crm_notes for select using (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "crm_notes: salesperson inserts own" on crm_notes for insert with check (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
-- Append-only thread -- no update/delete policy for anyone but admin
-- (matching property_request_status_history's precedent: a note is a
-- historical record, not something meant to be edited after the fact).
create policy "crm_notes: admin manages all" on crm_notes for all using (is_admin()) with check (is_admin());

create table crm_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references crm_clients(id) on delete cascade,
  request_id uuid references property_requests(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_tasks_linked_to_something check (client_id is not null or request_id is not null)
);
create index crm_tasks_client_id_idx on crm_tasks(client_id) where client_id is not null;
create index crm_tasks_request_id_idx on crm_tasks(request_id) where request_id is not null;
create index crm_tasks_due_at_idx on crm_tasks(due_at) where status = 'pending';

alter table crm_tasks enable row level security;
create policy "crm_tasks: broker selects own" on crm_tasks for select using (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "crm_tasks: broker inserts own" on crm_tasks for insert with check (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "crm_tasks: broker updates own" on crm_tasks for update using (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where broker_id = (select broker_id from profiles where id = auth.uid()))
) with check (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "crm_tasks: broker deletes own" on crm_tasks for delete using (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "crm_tasks: salesperson selects own" on crm_tasks for select using (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "crm_tasks: salesperson inserts own" on crm_tasks for insert with check (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "crm_tasks: salesperson updates own" on crm_tasks for update using (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
) with check (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "crm_tasks: salesperson deletes own" on crm_tasks for delete using (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
  or request_id in (select id from property_requests where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "crm_tasks: admin reads all" on crm_tasks for select using (is_admin());

notify pgrst, 'reload schema';
