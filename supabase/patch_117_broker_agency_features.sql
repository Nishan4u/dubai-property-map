-- Broker Agency portal feature parity: adds My Requests, Clients,
-- Calendar, Collections, Notifications, and Integrations to the
-- broker_agency portal, mirroring what individual broker accounts
-- already have. Deliberately excludes the Broker/Salesperson Referral
-- Program -- broker_agency was never part of that program (see
-- broker_referral_signups' own check constraints, which only ever
-- allowed 'broker'/'salesperson') and this batch doesn't change that.
--
-- Notifications needs no schema change at all -- it's already keyed on
-- profiles.id (auth user id), generic across every account type.
--
-- Every statement is safely re-runnable, per the patch_104 lesson.

-- ---------- Integrations: extend crm_integrations with broker_agency ----------
alter table crm_integrations add column if not exists brokerage_id uuid references brokerages(id) on delete cascade;
create index if not exists crm_integrations_brokerage_id_idx on crm_integrations(brokerage_id);

alter table crm_integrations drop constraint if exists crm_integrations_owner_type_check;
alter table crm_integrations add constraint crm_integrations_owner_type_check check (owner_type in ('broker', 'salesperson', 'developer', 'broker_agency'));

drop policy if exists "crm_integrations: broker_agency selects own" on crm_integrations;
create policy "crm_integrations: broker_agency selects own" on crm_integrations for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: broker_agency inserts own" on crm_integrations;
create policy "crm_integrations: broker_agency inserts own" on crm_integrations for insert with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: broker_agency updates own" on crm_integrations;
create policy "crm_integrations: broker_agency updates own" on crm_integrations for update using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
) with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: broker_agency deletes own" on crm_integrations;
create policy "crm_integrations: broker_agency deletes own" on crm_integrations for delete using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);

drop policy if exists "crm_integration_logs: owner reads own" on crm_integration_logs;
create policy "crm_integration_logs: owner reads own" on crm_integration_logs for select using (
  integration_id in (
    select id from crm_integrations
    where broker_id = (select broker_id from profiles where id = auth.uid())
       or salesperson_id = (select salesperson_id from profiles where id = auth.uid())
       or developer_id = (select developer_id from profiles where id = auth.uid())
       or brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
  )
);

-- ---------- Clients: extend crm_clients + crm_notes with broker_agency ----------
-- Unlike agency_property_requests (patch_68, deliberately its own table --
-- an agency's *submitted requests* must never mix with an individual
-- broker's), an agency's own client list is directly analogous to a
-- broker's, so this reuses crm_clients' existing owner-discriminator
-- pattern (already extended once this batch for crm_integrations) rather
-- than duplicating the whole notes/detail-page feature into a parallel
-- table.
alter table crm_clients add column if not exists brokerage_id uuid references brokerages(id) on delete cascade;
create index if not exists crm_clients_brokerage_id_idx on crm_clients(brokerage_id) where brokerage_id is not null;

alter table crm_clients drop constraint if exists crm_clients_owner_match;
alter table crm_clients add constraint crm_clients_owner_match check (
  (owner_type = 'broker' and broker_id is not null and salesperson_id is null and brokerage_id is null)
  or (owner_type = 'salesperson' and salesperson_id is not null and broker_id is null and brokerage_id is null)
  or (owner_type = 'broker_agency' and brokerage_id is not null and broker_id is null and salesperson_id is null)
);
alter table crm_clients drop constraint if exists crm_clients_owner_type_check;
alter table crm_clients add constraint crm_clients_owner_type_check check (owner_type in ('broker', 'salesperson', 'broker_agency'));

drop policy if exists "crm_clients: broker_agency selects own" on crm_clients;
create policy "crm_clients: broker_agency selects own" on crm_clients for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_clients: broker_agency inserts own" on crm_clients;
create policy "crm_clients: broker_agency inserts own" on crm_clients for insert with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_clients: broker_agency updates own" on crm_clients;
create policy "crm_clients: broker_agency updates own" on crm_clients for update using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
) with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_clients: broker_agency deletes own" on crm_clients;
create policy "crm_clients: broker_agency deletes own" on crm_clients for delete using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);

drop policy if exists "crm_notes: broker_agency reads own" on crm_notes;
create policy "crm_notes: broker_agency reads own" on crm_notes for select using (
  client_id in (select id from crm_clients where brokerage_id = (select broker_agency_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_notes: broker_agency inserts own" on crm_notes;
create policy "crm_notes: broker_agency inserts own" on crm_notes for insert with check (
  client_id in (select id from crm_clients where brokerage_id = (select broker_agency_id from profiles where id = auth.uid()))
);

-- ---------- Calendar: extend crm_appointments with broker_agency ----------
alter table crm_appointments add column if not exists brokerage_id uuid references brokerages(id) on delete cascade;
create index if not exists crm_appointments_brokerage_id_idx on crm_appointments(brokerage_id) where brokerage_id is not null;

alter table crm_appointments drop constraint if exists crm_appointments_owner_match;
alter table crm_appointments add constraint crm_appointments_owner_match check (
  (owner_type = 'broker' and broker_id is not null and salesperson_id is null and developer_id is null and brokerage_id is null)
  or (owner_type = 'salesperson' and salesperson_id is not null and broker_id is null and developer_id is null and brokerage_id is null)
  or (owner_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null and brokerage_id is null)
  or (owner_type = 'broker_agency' and brokerage_id is not null and broker_id is null and salesperson_id is null and developer_id is null)
);
alter table crm_appointments drop constraint if exists crm_appointments_owner_type_check;
alter table crm_appointments add constraint crm_appointments_owner_type_check check (owner_type in ('broker', 'salesperson', 'developer', 'broker_agency'));

drop policy if exists "crm_appointments: broker_agency selects own" on crm_appointments;
create policy "crm_appointments: broker_agency selects own" on crm_appointments for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: broker_agency inserts own" on crm_appointments;
create policy "crm_appointments: broker_agency inserts own" on crm_appointments for insert with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: broker_agency updates own" on crm_appointments;
create policy "crm_appointments: broker_agency updates own" on crm_appointments for update using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
) with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: broker_agency deletes own" on crm_appointments;
create policy "crm_appointments: broker_agency deletes own" on crm_appointments for delete using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);

-- ---------- Collections: extend crm_collections + crm_collection_items with broker_agency ----------
alter table crm_collections add column if not exists brokerage_id uuid references brokerages(id) on delete cascade;
create index if not exists crm_collections_brokerage_id_idx on crm_collections(brokerage_id) where brokerage_id is not null;

alter table crm_collections drop constraint if exists crm_collections_owner_match;
alter table crm_collections add constraint crm_collections_owner_match check (
  (owner_type = 'broker' and broker_id is not null and salesperson_id is null and developer_id is null and brokerage_id is null)
  or (owner_type = 'salesperson' and salesperson_id is not null and broker_id is null and developer_id is null and brokerage_id is null)
  or (owner_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null and brokerage_id is null)
  or (owner_type = 'broker_agency' and brokerage_id is not null and broker_id is null and salesperson_id is null and developer_id is null)
);
alter table crm_collections drop constraint if exists crm_collections_owner_type_check;
alter table crm_collections add constraint crm_collections_owner_type_check check (owner_type in ('broker', 'salesperson', 'developer', 'broker_agency'));

drop policy if exists "crm_collections: broker_agency selects own" on crm_collections;
create policy "crm_collections: broker_agency selects own" on crm_collections for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: broker_agency inserts own" on crm_collections;
create policy "crm_collections: broker_agency inserts own" on crm_collections for insert with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: broker_agency updates own" on crm_collections;
create policy "crm_collections: broker_agency updates own" on crm_collections for update using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
) with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: broker_agency deletes own" on crm_collections;
create policy "crm_collections: broker_agency deletes own" on crm_collections for delete using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);

drop policy if exists "crm_collection_items: broker_agency selects own" on crm_collection_items;
create policy "crm_collection_items: broker_agency selects own" on crm_collection_items for select using (
  collection_id in (select id from crm_collections where brokerage_id = (select broker_agency_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_items: broker_agency inserts own" on crm_collection_items;
create policy "crm_collection_items: broker_agency inserts own" on crm_collection_items for insert with check (
  collection_id in (select id from crm_collections where brokerage_id = (select broker_agency_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_items: broker_agency deletes own" on crm_collection_items;
create policy "crm_collection_items: broker_agency deletes own" on crm_collection_items for delete using (
  collection_id in (select id from crm_collections where brokerage_id = (select broker_agency_id from profiles where id = auth.uid()))
);

notify pgrst, 'reload schema';
