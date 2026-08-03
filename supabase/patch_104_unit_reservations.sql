-- Unit Reservation + Digital Contract (core), Modules 14 + 25. The
-- existing `bookings` table is a site-visit scheduler, not a real
-- reservation/contract concept -- this is genuinely new, not an
-- extension of it.

-- 1. Extend crm_clients (patch_98) to a 3-way owner: developers have no
--    client-tracking mechanism at all today, and a reservation needs to
--    know who the buyer is. Additive -- existing broker/salesperson rows
--    and RLS keep working exactly as they do today.
alter table crm_clients add column if not exists developer_id uuid references developers(id) on delete cascade;

-- owner_type's original check (broker/salesperson only) was an unnamed
-- inline column check, so Postgres assigned its own name rather than a
-- declared one -- looked up dynamically rather than guessed, same as
-- patch_96's brokers/salespersons payment_type widening.
do $$
declare
  v_conname text;
begin
  select conname into v_conname from pg_constraint
    where conrelid = 'crm_clients'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%owner_type%';
  if v_conname is not null then
    execute format('alter table crm_clients drop constraint %I', v_conname);
  end if;
  alter table crm_clients add constraint crm_clients_owner_type_check
    check (owner_type in ('broker', 'salesperson', 'developer'));
end;
$$;

alter table crm_clients drop constraint if exists crm_clients_owner_match;
alter table crm_clients add constraint crm_clients_owner_match check (
  (owner_type = 'broker' and broker_id is not null and salesperson_id is null and developer_id is null)
  or (owner_type = 'salesperson' and salesperson_id is not null and broker_id is null and developer_id is null)
  or (owner_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null)
);
create index if not exists crm_clients_developer_id_idx on crm_clients(developer_id) where developer_id is not null;

create policy "crm_clients: developer selects own" on crm_clients for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "crm_clients: developer inserts own" on crm_clients for insert with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "crm_clients: developer updates own" on crm_clients for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "crm_clients: developer deletes own" on crm_clients for delete using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);

-- 2. The reservation record IS the contract -- no separate "contract"
--    entity. unit_type_id references a category (project_unit_types),
--    not an individual numbered unit -- Module 16 "Live Inventory" isn't
--    built, so unit_number is free text with no availability locking.
create table unit_reservations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references crm_clients(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  unit_type_id uuid references project_unit_types(id) on delete set null,
  unit_number text,
  price_aed numeric not null,
  deposit_amount_aed numeric,
  expires_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'signed', 'cancelled')),
  contract_snapshot_html text,
  sign_token uuid not null default gen_random_uuid() unique,
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  signed_by_name text,
  signature_type text check (signature_type in ('typed', 'drawn')),
  signature_data text,
  signed_ip text,
  signed_user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index unit_reservations_client_id_idx on unit_reservations(client_id);
create index unit_reservations_project_id_idx on unit_reservations(project_id);

alter table unit_reservations enable row level security;

-- Ownership derived via client_id -> crm_clients (same IN-subquery shape
-- as crm_notes/crm_tasks), not a redundant owner column of its own. No
-- public policy at all -- the buyer-signing flow goes entirely through
-- service-role routes keyed by sign_token (same pattern as patch_53's
-- invitations-by-token route), never through RLS.
create policy "unit_reservations: broker selects own" on unit_reservations for select using (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "unit_reservations: broker inserts own" on unit_reservations for insert with check (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "unit_reservations: broker updates own" on unit_reservations for update using (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
) with check (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
);
create policy "unit_reservations: broker deletes own" on unit_reservations for delete using (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
);

create policy "unit_reservations: salesperson selects own" on unit_reservations for select using (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "unit_reservations: salesperson inserts own" on unit_reservations for insert with check (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "unit_reservations: salesperson updates own" on unit_reservations for update using (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
) with check (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
create policy "unit_reservations: salesperson deletes own" on unit_reservations for delete using (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);

create policy "unit_reservations: developer selects own" on unit_reservations for select using (
  client_id in (select id from crm_clients where developer_id = (select developer_id from profiles where id = auth.uid()))
);
create policy "unit_reservations: developer inserts own" on unit_reservations for insert with check (
  client_id in (select id from crm_clients where developer_id = (select developer_id from profiles where id = auth.uid()))
);
create policy "unit_reservations: developer updates own" on unit_reservations for update using (
  client_id in (select id from crm_clients where developer_id = (select developer_id from profiles where id = auth.uid()))
) with check (
  client_id in (select id from crm_clients where developer_id = (select developer_id from profiles where id = auth.uid()))
);
create policy "unit_reservations: developer deletes own" on unit_reservations for delete using (
  client_id in (select id from crm_clients where developer_id = (select developer_id from profiles where id = auth.uid()))
);

create policy "unit_reservations: admin reads all" on unit_reservations for select using (is_admin());

notify pgrst, 'reload schema';
