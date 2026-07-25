-- Transactional email log. Written exclusively via the service-role
-- client from src/lib/email.ts (never from a user's own RLS-scoped
-- session), so admin-only read access is correct and sufficient.
create table email_logs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  to_email text not null,
  subject text not null,
  body_html text,
  related_entity_type text,
  related_entity_id uuid,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempt_count int not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index email_logs_related_idx on email_logs(related_entity_type, related_entity_id);
create index email_logs_status_idx on email_logs(status);

alter table email_logs enable row level security;
create policy "email_logs: admin manages all" on email_logs for all using (is_admin()) with check (is_admin());
