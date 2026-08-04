-- WhatsApp Business API (Module 15 "Communication" / Module 22 "WhatsApp
-- Notifications"): adds WhatsApp as a third Marketing Campaign channel
-- alongside email/sms (patch_110). whatsapp_logs mirrors sms_logs' exact
-- shape so it's auditable the same way. Sends go through Meta's WhatsApp
-- Cloud API (src/lib/whatsapp.ts) -- gated behind WHATSAPP_ACCESS_TOKEN /
-- WHATSAPP_PHONE_NUMBER_ID, clearly recording "not configured" rather than
-- a fabricated sent message when those aren't set, same honesty pattern
-- as sendSms()/sendEmail().
--
-- Every statement is safely re-runnable, per the patch_104 lesson.

alter table marketing_campaigns drop constraint if exists marketing_campaigns_channel_check;
alter table marketing_campaigns add constraint marketing_campaigns_channel_check check (channel in ('email', 'sms', 'whatsapp'));

create table if not exists whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references marketing_campaigns(id) on delete set null,
  to_phone text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_logs_campaign_id_idx on whatsapp_logs(campaign_id);

alter table whatsapp_logs enable row level security;

drop policy if exists "whatsapp_logs: admin manages all" on whatsapp_logs;
create policy "whatsapp_logs: admin manages all" on whatsapp_logs for all using (is_admin()) with check (is_admin());

notify pgrst, 'reload schema';
