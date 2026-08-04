-- CRM Communication History (rest of Module 15): Email History, Call
-- Logs, WhatsApp History.
--
-- Email History is purely additive RLS on the EXISTING email_logs
-- table (patch_31/45/57) -- broker/salesperson/developer can now read
-- email history for THEIR OWN clients, matched by to_email =
-- crm_clients.email (email_logs has no client_id column, and adding
-- one would mean threading a new param through sendEmail()'s ~41 call
-- sites for a benefit only the reservation flow could realistically
-- populate -- not worth the blast radius). The existing "email_logs:
-- admin manages all" policy is completely untouched; this only widens
-- read access, nothing existing changes.
--
-- Call Logs / WhatsApp History: no live telephony or WhatsApp Business
-- API integration exists anywhere in this codebase -- this is a
-- manually-entered contact record, same "no owner column, derived via
-- client_id" pattern crm_notes/crm_tasks already established (patch_98),
-- one table with a channel enum rather than two near-duplicate tables
-- (mirrors project_events' own event_type enum precedent).
--
-- Every statement is safely re-runnable (create table if not exists,
-- drop policy if exists before create), per the lesson from patch_104:
-- Supabase's SQL editor doesn't roll back the whole pasted script on a
-- single statement's error, it continues past it.

drop policy if exists "email_logs: broker reads own clients" on email_logs;
create policy "email_logs: broker reads own clients" on email_logs for select using (
  to_email in (select email from crm_clients where email is not null and broker_id = (select broker_id from profiles where id = auth.uid()))
);

drop policy if exists "email_logs: salesperson reads own clients" on email_logs;
create policy "email_logs: salesperson reads own clients" on email_logs for select using (
  to_email in (select email from crm_clients where email is not null and salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);

drop policy if exists "email_logs: developer reads own clients" on email_logs;
create policy "email_logs: developer reads own clients" on email_logs for select using (
  to_email in (select email from crm_clients where email is not null and developer_id = (select developer_id from profiles where id = auth.uid()))
);

create table if not exists crm_communication_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references crm_clients(id) on delete cascade,
  channel text not null check (channel in ('call', 'whatsapp')),
  direction text not null check (direction in ('outbound', 'inbound')),
  outcome text check (outcome in ('connected', 'no_answer', 'voicemail', 'other')),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists crm_communication_logs_client_id_idx on crm_communication_logs(client_id);

alter table crm_communication_logs enable row level security;

-- Append-only (no update/delete policy for non-admin) -- a contact log
-- is a historical record, matching crm_notes' own precedent.
drop policy if exists "crm_communication_logs: broker selects own" on crm_communication_logs;
create policy "crm_communication_logs: broker selects own" on crm_communication_logs for select using (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_communication_logs: broker inserts own" on crm_communication_logs;
create policy "crm_communication_logs: broker inserts own" on crm_communication_logs for insert with check (
  client_id in (select id from crm_clients where broker_id = (select broker_id from profiles where id = auth.uid()))
);

drop policy if exists "crm_communication_logs: salesperson selects own" on crm_communication_logs;
create policy "crm_communication_logs: salesperson selects own" on crm_communication_logs for select using (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_communication_logs: salesperson inserts own" on crm_communication_logs;
create policy "crm_communication_logs: salesperson inserts own" on crm_communication_logs for insert with check (
  client_id in (select id from crm_clients where salesperson_id = (select salesperson_id from profiles where id = auth.uid()))
);

drop policy if exists "crm_communication_logs: developer selects own" on crm_communication_logs;
create policy "crm_communication_logs: developer selects own" on crm_communication_logs for select using (
  client_id in (select id from crm_clients where developer_id = (select developer_id from profiles where id = auth.uid()))
);
drop policy if exists "crm_communication_logs: developer inserts own" on crm_communication_logs;
create policy "crm_communication_logs: developer inserts own" on crm_communication_logs for insert with check (
  client_id in (select id from crm_clients where developer_id = (select developer_id from profiles where id = auth.uid()))
);

drop policy if exists "crm_communication_logs: admin reads all" on crm_communication_logs;
create policy "crm_communication_logs: admin reads all" on crm_communication_logs for select using (is_admin());

notify pgrst, 'reload schema';
