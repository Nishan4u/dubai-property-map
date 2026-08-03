-- Meeting & Collaboration (core), Module 23. Two new capabilities on top
-- of the existing crm_clients 3-way owner pattern (patch_98 + patch_104):
--
-- 1. crm_appointments -- an internal broker/salesperson/developer
--    calendar (distinct from `bookings`, which is the public buyer-facing
--    site-visit scheduler). Optionally linked to a crm_clients row.
--    "Video Meetings" is just an optional meeting_link URL field, no
--    embedded video / new dependency.
-- 2. crm_collections + crm_collection_items -- a named, shareable set of
--    projects a broker/salesperson/developer curates to present to a
--    client via a public tokenized link (Shared Collections / Client
--    Presentation Mode).
--
-- Every statement is safely re-runnable (create table if not exists,
-- drop policy if exists before create), per the lesson from patch_104:
-- Supabase's SQL editor doesn't roll back the whole pasted script on a
-- single statement's error, it continues past it.

create table if not exists crm_appointments (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('broker', 'salesperson', 'developer')),
  broker_id uuid references brokers(id) on delete cascade,
  salesperson_id uuid references salespersons(id) on delete cascade,
  developer_id uuid references developers(id) on delete cascade,
  client_id uuid references crm_clients(id) on delete set null,
  title text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer,
  location text,
  meeting_link text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_appointments_owner_match check (
    (owner_type = 'broker' and broker_id is not null and salesperson_id is null and developer_id is null)
    or (owner_type = 'salesperson' and salesperson_id is not null and broker_id is null and developer_id is null)
    or (owner_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null)
  )
);
create index if not exists crm_appointments_broker_id_idx on crm_appointments(broker_id) where broker_id is not null;
create index if not exists crm_appointments_salesperson_id_idx on crm_appointments(salesperson_id) where salesperson_id is not null;
create index if not exists crm_appointments_developer_id_idx on crm_appointments(developer_id) where developer_id is not null;
create index if not exists crm_appointments_client_id_idx on crm_appointments(client_id) where client_id is not null;
create index if not exists crm_appointments_scheduled_at_idx on crm_appointments(scheduled_at);

alter table crm_appointments enable row level security;

drop policy if exists "crm_appointments: broker selects own" on crm_appointments;
create policy "crm_appointments: broker selects own" on crm_appointments for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: broker inserts own" on crm_appointments;
create policy "crm_appointments: broker inserts own" on crm_appointments for insert with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: broker updates own" on crm_appointments;
create policy "crm_appointments: broker updates own" on crm_appointments for update using (
  broker_id = (select broker_id from profiles where id = auth.uid())
) with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: broker deletes own" on crm_appointments;
create policy "crm_appointments: broker deletes own" on crm_appointments for delete using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);

drop policy if exists "crm_appointments: salesperson selects own" on crm_appointments;
create policy "crm_appointments: salesperson selects own" on crm_appointments for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: salesperson inserts own" on crm_appointments;
create policy "crm_appointments: salesperson inserts own" on crm_appointments for insert with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: salesperson updates own" on crm_appointments;
create policy "crm_appointments: salesperson updates own" on crm_appointments for update using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
) with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: salesperson deletes own" on crm_appointments;
create policy "crm_appointments: salesperson deletes own" on crm_appointments for delete using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);

drop policy if exists "crm_appointments: developer selects own" on crm_appointments;
create policy "crm_appointments: developer selects own" on crm_appointments for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: developer inserts own" on crm_appointments;
create policy "crm_appointments: developer inserts own" on crm_appointments for insert with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: developer updates own" on crm_appointments;
create policy "crm_appointments: developer updates own" on crm_appointments for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "crm_appointments: developer deletes own" on crm_appointments;
create policy "crm_appointments: developer deletes own" on crm_appointments for delete using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);

drop policy if exists "crm_appointments: admin reads all" on crm_appointments;
create policy "crm_appointments: admin reads all" on crm_appointments for select using (is_admin());

-- crm_collections: a named, shareable set of projects. No public RLS
-- policy at all -- the public /present/[token] viewer goes entirely
-- through a service-role API route keyed by share_token, mirroring
-- unit_reservations' sign_token precedent (patch_104).
create table if not exists crm_collections (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('broker', 'salesperson', 'developer')),
  broker_id uuid references brokers(id) on delete cascade,
  salesperson_id uuid references salespersons(id) on delete cascade,
  developer_id uuid references developers(id) on delete cascade,
  client_id uuid references crm_clients(id) on delete set null,
  title text not null,
  share_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_collections_owner_match check (
    (owner_type = 'broker' and broker_id is not null and salesperson_id is null and developer_id is null)
    or (owner_type = 'salesperson' and salesperson_id is not null and broker_id is null and developer_id is null)
    or (owner_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null)
  )
);
create index if not exists crm_collections_broker_id_idx on crm_collections(broker_id) where broker_id is not null;
create index if not exists crm_collections_salesperson_id_idx on crm_collections(salesperson_id) where salesperson_id is not null;
create index if not exists crm_collections_developer_id_idx on crm_collections(developer_id) where developer_id is not null;
create index if not exists crm_collections_client_id_idx on crm_collections(client_id) where client_id is not null;

alter table crm_collections enable row level security;

drop policy if exists "crm_collections: broker selects own" on crm_collections;
create policy "crm_collections: broker selects own" on crm_collections for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: broker inserts own" on crm_collections;
create policy "crm_collections: broker inserts own" on crm_collections for insert with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: broker updates own" on crm_collections;
create policy "crm_collections: broker updates own" on crm_collections for update using (
  broker_id = (select broker_id from profiles where id = auth.uid())
) with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: broker deletes own" on crm_collections;
create policy "crm_collections: broker deletes own" on crm_collections for delete using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);

drop policy if exists "crm_collections: salesperson selects own" on crm_collections;
create policy "crm_collections: salesperson selects own" on crm_collections for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: salesperson inserts own" on crm_collections;
create policy "crm_collections: salesperson inserts own" on crm_collections for insert with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: salesperson updates own" on crm_collections;
create policy "crm_collections: salesperson updates own" on crm_collections for update using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
) with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: salesperson deletes own" on crm_collections;
create policy "crm_collections: salesperson deletes own" on crm_collections for delete using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);

drop policy if exists "crm_collections: developer selects own" on crm_collections;
create policy "crm_collections: developer selects own" on crm_collections for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: developer inserts own" on crm_collections;
create policy "crm_collections: developer inserts own" on crm_collections for insert with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: developer updates own" on crm_collections;
create policy "crm_collections: developer updates own" on crm_collections for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "crm_collections: developer deletes own" on crm_collections;
create policy "crm_collections: developer deletes own" on crm_collections for delete using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);

drop policy if exists "crm_collections: admin reads all" on crm_collections;
create policy "crm_collections: admin reads all" on crm_collections for select using (is_admin());

-- crm_collection_items: join table, ownership derived via collection_id
-- (no redundant owner column of its own), same pattern crm_notes/
-- crm_tasks already use deriving via client_id/request_id.
create table if not exists crm_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references crm_collections(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (collection_id, project_id)
);
create index if not exists crm_collection_items_collection_id_idx on crm_collection_items(collection_id);

alter table crm_collection_items enable row level security;

drop policy if exists "crm_collection_items: broker selects own" on crm_collection_items;
create policy "crm_collection_items: broker selects own" on crm_collection_items for select using (
  collection_id in (select id from crm_collections where broker_id = (select broker_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_items: broker inserts own" on crm_collection_items;
create policy "crm_collection_items: broker inserts own" on crm_collection_items for insert with check (
  collection_id in (select id from crm_collections where broker_id = (select broker_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_items: broker deletes own" on crm_collection_items;
create policy "crm_collection_items: broker deletes own" on crm_collection_items for delete using (
  collection_id in (select id from crm_collections where broker_id = (select broker_id from profiles where id = auth.uid()))
);

drop policy if exists "crm_collection_items: salesperson selects own" on crm_collection_items;
create policy "crm_collection_items: salesperson selects own" on crm_collection_items for select using (
  collection_id in (select id from crm_collections where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_items: salesperson inserts own" on crm_collection_items;
create policy "crm_collection_items: salesperson inserts own" on crm_collection_items for insert with check (
  collection_id in (select id from crm_collections where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_items: salesperson deletes own" on crm_collection_items;
create policy "crm_collection_items: salesperson deletes own" on crm_collection_items for delete using (
  collection_id in (select id from crm_collections where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);

drop policy if exists "crm_collection_items: developer selects own" on crm_collection_items;
create policy "crm_collection_items: developer selects own" on crm_collection_items for select using (
  collection_id in (select id from crm_collections where developer_id = (select developer_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_items: developer inserts own" on crm_collection_items;
create policy "crm_collection_items: developer inserts own" on crm_collection_items for insert with check (
  collection_id in (select id from crm_collections where developer_id = (select developer_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_collection_items: developer deletes own" on crm_collection_items;
create policy "crm_collection_items: developer deletes own" on crm_collection_items for delete using (
  collection_id in (select id from crm_collections where developer_id = (select developer_id from profiles where id = auth.uid()))
);

drop policy if exists "crm_collection_items: admin reads all" on crm_collection_items;
create policy "crm_collection_items: admin reads all" on crm_collection_items for select using (is_admin());

notify pgrst, 'reload schema';
