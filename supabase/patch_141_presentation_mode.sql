-- Presentation Studio 2.0, item 5: a single mode discriminator on
-- crm_collections. This changes which of item 4's new sections (Payment
-- Plan, Location Intelligence, Unit Types) render/how they're emphasized
-- on the public /present/[token] page -- NOT four separate page
-- templates. Existing collections default to 'default' and render
-- unchanged.
alter table crm_collections add column if not exists mode text not null default 'default';
alter table crm_collections drop constraint if exists crm_collections_mode_check;
alter table crm_collections add constraint crm_collections_mode_check
  check (mode in ('default', 'investor', 'end_user', 'quick_pitch'));

notify pgrst, 'reload schema';
