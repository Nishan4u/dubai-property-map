-- Connect-Any-CRM (last piece of Module 15): a generic, self-service
-- outbound-webhook + secret-authenticated JSON pull-feed framework a
-- broker/salesperson/developer can point at their own real CRM (its
-- native webhook receiver, or Zapier/Make/n8n) -- not a fake named-
-- vendor connector, since no real CRM vendor account/credentials exist
-- for this platform. Separate from -- and doesn't touch -- the existing
-- narrow per-developer sendLeadWebhook (developers.lead_webhook_url,
-- patch_22), which stays exactly as-is.
--
-- Mirrors crm_clients' own 3-way owner-discriminator pattern (owner_type
-- + broker_id/salesperson_id/developer_id, exactly one set) and its
-- exact per-owner select/insert/update/delete policy shape (patch_98).
--
-- Every statement is safely re-runnable, per the patch_104 lesson.

create table if not exists crm_integrations (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('broker', 'salesperson', 'developer')),
  broker_id uuid references brokers(id) on delete cascade,
  salesperson_id uuid references salespersons(id) on delete cascade,
  developer_id uuid references developers(id) on delete cascade,
  name text not null,
  webhook_url text,
  secret text not null,
  events text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);
create index if not exists crm_integrations_broker_id_idx on crm_integrations(broker_id);
create index if not exists crm_integrations_salesperson_id_idx on crm_integrations(salesperson_id);
create index if not exists crm_integrations_developer_id_idx on crm_integrations(developer_id);

alter table crm_integrations enable row level security;

drop policy if exists "crm_integrations: broker selects own" on crm_integrations;
create policy "crm_integrations: broker selects own" on crm_integrations for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: broker inserts own" on crm_integrations;
create policy "crm_integrations: broker inserts own" on crm_integrations for insert with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: broker updates own" on crm_integrations;
create policy "crm_integrations: broker updates own" on crm_integrations for update using (
  broker_id = (select broker_id from profiles where id = auth.uid())
) with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: broker deletes own" on crm_integrations;
create policy "crm_integrations: broker deletes own" on crm_integrations for delete using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);

drop policy if exists "crm_integrations: salesperson selects own" on crm_integrations;
create policy "crm_integrations: salesperson selects own" on crm_integrations for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: salesperson inserts own" on crm_integrations;
create policy "crm_integrations: salesperson inserts own" on crm_integrations for insert with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: salesperson updates own" on crm_integrations;
create policy "crm_integrations: salesperson updates own" on crm_integrations for update using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
) with check (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: salesperson deletes own" on crm_integrations;
create policy "crm_integrations: salesperson deletes own" on crm_integrations for delete using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);

drop policy if exists "crm_integrations: developer selects own" on crm_integrations;
create policy "crm_integrations: developer selects own" on crm_integrations for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: developer inserts own" on crm_integrations;
create policy "crm_integrations: developer inserts own" on crm_integrations for insert with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: developer updates own" on crm_integrations;
create policy "crm_integrations: developer updates own" on crm_integrations for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
drop policy if exists "crm_integrations: developer deletes own" on crm_integrations;
create policy "crm_integrations: developer deletes own" on crm_integrations for delete using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);

-- Select-only for admin, deliberately not "for all" -- oversight, not
-- ownership, matching crm_clients' own admin policy precedent.
drop policy if exists "crm_integrations: admin reads all" on crm_integrations;
create policy "crm_integrations: admin reads all" on crm_integrations for select using (is_admin());

create table if not exists crm_integration_logs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references crm_integrations(id) on delete cascade,
  event text not null,
  status text not null check (status in ('success', 'failed')),
  response_code int,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists crm_integration_logs_integration_id_idx on crm_integration_logs(integration_id);

alter table crm_integration_logs enable row level security;

-- Read-only for the owning broker/salesperson/developer via a join back
-- to crm_integrations -- inserts only ever happen server-side via the
-- service-role dispatcher (src/lib/crmIntegrations.ts), which bypasses
-- RLS entirely, so no insert policy is needed for any app role.
drop policy if exists "crm_integration_logs: owner reads own" on crm_integration_logs;
create policy "crm_integration_logs: owner reads own" on crm_integration_logs for select using (
  integration_id in (
    select id from crm_integrations
    where broker_id = (select broker_id from profiles where id = auth.uid())
       or salesperson_id = (select salesperson_id from profiles where id = auth.uid())
       or developer_id = (select developer_id from profiles where id = auth.uid())
  )
);
drop policy if exists "crm_integration_logs: admin reads all" on crm_integration_logs;
create policy "crm_integration_logs: admin reads all" on crm_integration_logs for select using (is_admin());

notify pgrst, 'reload schema';
