-- Agency White-Label Storefront: a broker agency can claim a subdomain
-- (e.g. smithrealty.dubaipropertymap.ae) and curate a public, persistent
-- list of projects to showcase there, replacing Dubai Property Map's own
-- branding with their own logo/name/contact on that one page. See
-- PLAN.md item "Agency White-Label Storefront" for full context.
--
-- Deliberately separate from crm_collections -- that table's meaning is
-- "a private, client-specific share link" (has client_id, share_token,
-- hide_* toggles aimed at one buyer negotiation). A storefront is public,
-- persistent, and agency-wide, so it gets its own small table rather than
-- bolting a "public" flag onto a table whose other columns wouldn't apply.

alter table brokerages add column if not exists subdomain text;

alter table brokerages drop constraint if exists brokerages_subdomain_format_check;
alter table brokerages add constraint brokerages_subdomain_format_check
  check (subdomain is null or subdomain ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$');

alter table brokerages drop constraint if exists brokerages_subdomain_reserved_check;
alter table brokerages add constraint brokerages_subdomain_reserved_check
  check (subdomain is null or subdomain not in (
    'www','api','admin','app','mail','staging','dev','ftp','cdn','static',
    'blog','help','support','status','docs','dashboard','portal','my','secure'
  ));

create unique index if not exists brokerages_subdomain_uidx on brokerages(subdomain) where subdomain is not null;

create table if not exists brokerage_storefront_items (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references brokerages(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (brokerage_id, project_id)
);
create index if not exists brokerage_storefront_items_brokerage_id_idx on brokerage_storefront_items(brokerage_id);

alter table brokerage_storefront_items enable row level security;

-- Agency manages its own storefront items -- same owner-scoped shape as
-- every other broker_agency-owned CRM table this session (crm_clients,
-- crm_collections, crm_appointments, crm_integrations). No public/anon
-- select policy needed: the public storefront page reads through a
-- service-role API route (/api/agency-storefront/[subdomain]), mirroring
-- /api/presentations/[token]/route.ts exactly -- never direct table RLS.
drop policy if exists "brokerage_storefront_items: agency selects own" on brokerage_storefront_items;
create policy "brokerage_storefront_items: agency selects own" on brokerage_storefront_items for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "brokerage_storefront_items: agency inserts own" on brokerage_storefront_items;
create policy "brokerage_storefront_items: agency inserts own" on brokerage_storefront_items for insert with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "brokerage_storefront_items: agency updates own" on brokerage_storefront_items;
create policy "brokerage_storefront_items: agency updates own" on brokerage_storefront_items for update using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
) with check (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "brokerage_storefront_items: agency deletes own" on brokerage_storefront_items;
create policy "brokerage_storefront_items: agency deletes own" on brokerage_storefront_items for delete using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);
drop policy if exists "brokerage_storefront_items: admin selects all" on brokerage_storefront_items;
create policy "brokerage_storefront_items: admin selects all" on brokerage_storefront_items for select using (is_admin());

notify pgrst, 'reload schema';
