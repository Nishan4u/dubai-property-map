-- Adds the "hide info to drive engagement" toggles to shared presentations
-- (crm_collections / the public /present/[token] page) -- an agent can
-- choose to hide the developer name, price, and/or exact location on a
-- given collection so the buyer has to contact them for the full details.
-- No new columns needed for agent branding itself (name/photo/phone/
-- whatsapp/email already exist on brokers, salespersons, brokerages, and
-- developers) -- only these three new toggles are new.
alter table crm_collections add column if not exists hide_developer_name boolean not null default false;
alter table crm_collections add column if not exists hide_price boolean not null default false;
alter table crm_collections add column if not exists hide_location boolean not null default false;

notify pgrst, 'reload schema';
