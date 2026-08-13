-- Lets a broker attach their OWN broker_listings (not just developer
-- projects) into a Collection/presentation.
--
-- crm_collection_items today is strictly project_id-shaped (not null,
-- no alternative). This adds a second, mutually-exclusive item type.
alter table crm_collection_items alter column project_id drop not null;
alter table crm_collection_items add column if not exists broker_listing_id uuid references broker_listings(id) on delete cascade;

-- Exactly one of project_id / broker_listing_id must be set -- a
-- collection item is either a developer project or a broker's own
-- listing, never both, never neither.
alter table crm_collection_items drop constraint if exists crm_collection_items_item_type_check;
alter table crm_collection_items add constraint crm_collection_items_item_type_check check (
  (project_id is not null and broker_listing_id is null) or
  (project_id is null and broker_listing_id is not null)
);

create unique index if not exists crm_collection_items_collection_listing_uidx
  on crm_collection_items(collection_id, broker_listing_id) where broker_listing_id is not null;
create index if not exists crm_collection_items_broker_listing_id_idx on crm_collection_items(broker_listing_id);

-- Tighten the 4 existing owner-insert policies. Before this, none of
-- them checked the referenced row's ownership at all -- they only
-- checked collection_id. Without this, any of the 4 roles could
-- otherwise insert an arbitrary broker_listing_id (including another
-- broker's *private* listing) into their own collection the moment
-- broker_listing_id became a real column. Select/delete policies are
-- untouched -- they're already collection_id-only and correctly
-- permissive regardless of what's inside the row.
drop policy if exists "crm_collection_items: broker inserts own" on crm_collection_items;
create policy "crm_collection_items: broker inserts own" on crm_collection_items for insert with check (
  collection_id in (select id from crm_collections where broker_id = (select broker_id from profiles where id = auth.uid()))
  and (
    broker_listing_id is null
    or broker_listing_id in (select id from broker_listings where broker_id = (select broker_id from profiles where id = auth.uid()))
  )
);

drop policy if exists "crm_collection_items: salesperson inserts own" on crm_collection_items;
create policy "crm_collection_items: salesperson inserts own" on crm_collection_items for insert with check (
  collection_id in (select id from crm_collections where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
  and broker_listing_id is null
);

drop policy if exists "crm_collection_items: developer inserts own" on crm_collection_items;
create policy "crm_collection_items: developer inserts own" on crm_collection_items for insert with check (
  collection_id in (select id from crm_collections where developer_id = (select developer_id from profiles where id = auth.uid()))
  and broker_listing_id is null
);

drop policy if exists "crm_collection_items: broker_agency inserts own" on crm_collection_items;
create policy "crm_collection_items: broker_agency inserts own" on crm_collection_items for insert with check (
  collection_id in (select id from crm_collections where brokerage_id = (select broker_agency_id from profiles where id = auth.uid()))
  and broker_listing_id is null
);

notify pgrst, 'reload schema';
