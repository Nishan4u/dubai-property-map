-- Tracks Resend's own message id so the /api/webhooks/resend endpoint can
-- correlate delivery/bounce/complaint events back to the right log row —
-- the initial sendEmail() call only proves Resend *accepted* the email for
-- sending, not that it was actually delivered to the recipient's inbox.
alter table email_logs add column if not exists resend_message_id text;
create unique index if not exists email_logs_resend_message_id_idx on email_logs(resend_message_id) where resend_message_id is not null;
alter table email_logs add column if not exists bounced_at timestamptz;

-- Finds and drops whatever the existing status check constraint is
-- actually named (rather than assuming a name).
do $$
declare
  r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'email_logs'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table email_logs drop constraint %I', r.conname);
  end loop;
end $$;

alter table email_logs add constraint email_logs_status_check
  check (status in ('pending', 'sent', 'failed', 'delivered', 'bounced', 'complained'));
