-- Marketing Campaigns (rest of Module 20): Email/SMS campaigns targeting
-- CRM clients, plus standalone landing pages. The existing in-app
-- NotificationBroadcast (buyers/developers, patch_21) already covers the
-- "push" concept and needs no schema change here -- it's extended in
-- application code only (a new "also send email" option) using the
-- existing email_logs table.
--
-- Email campaigns reuse the existing sendEmail()/email_logs pipeline.
-- SMS is genuinely new (no telephony integration exists anywhere in this
-- codebase) -- sms_logs mirrors email_logs' own shape so it's auditable
-- the same way, and clearly records "not configured" rather than a
-- fabricated success when no SMS vendor credentials are set.
--
-- Every statement is safely re-runnable, per the patch_104 lesson:
-- Supabase's SQL editor doesn't roll back the whole pasted script on a
-- single statement's error, it continues past it.

create table if not exists marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('email', 'sms')),
  subject text,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  recipient_count int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  created_by uuid references profiles(id),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table marketing_campaigns enable row level security;

drop policy if exists "marketing_campaigns: admin manages all" on marketing_campaigns;
create policy "marketing_campaigns: admin manages all" on marketing_campaigns for all using (is_admin()) with check (is_admin());

-- Opt-out flag for CRM clients -- the only realistic bulk-marketing
-- audience with real, broker/salesperson-collected contact info.
alter table crm_clients add column if not exists marketing_opt_out boolean not null default false;

create table if not exists sms_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references marketing_campaigns(id) on delete set null,
  to_phone text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);
create index if not exists sms_logs_campaign_id_idx on sms_logs(campaign_id);

alter table sms_logs enable row level security;

drop policy if exists "sms_logs: admin manages all" on sms_logs;
create policy "sms_logs: admin manages all" on sms_logs for all using (is_admin()) with check (is_admin());

create table if not exists landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  hero_image_url text,
  body text not null,
  cta_text text,
  cta_url text,
  published boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table landing_pages enable row level security;

drop policy if exists "landing_pages: public reads published" on landing_pages;
create policy "landing_pages: public reads published" on landing_pages for select using (published = true);

drop policy if exists "landing_pages: admin manages all" on landing_pages;
create policy "landing_pages: admin manages all" on landing_pages for all using (is_admin()) with check (is_admin());

notify pgrst, 'reload schema';
