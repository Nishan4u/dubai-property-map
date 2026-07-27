-- Broker/salesperson plans can optionally exclude Map access (defaults to
-- true so every existing plan keeps working exactly as it does today).
alter table subscription_plans add column if not exists map_access_included boolean not null default true;
