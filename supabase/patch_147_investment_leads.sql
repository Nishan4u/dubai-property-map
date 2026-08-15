-- Public Investment Lead-Qualification Wizard + gated Report.
--
-- This table is deliberately NOT reachable via any public/anonymous RLS
-- insert policy. This codebase already tried that once on `leads`
-- (schema.sql's original "leads: anyone can submit" policy) and it was
-- found to be a real, live production security vulnerability -- see
-- patch_40_gate_enquiries_to_verified_users.sql and
-- patch_48_reapply_lead_booking_gate.sql ("live testing found that
-- unauthenticated requests can still insert into leads/bookings directly
-- via the REST API"). Every write to this table goes through
-- POST /api/investment-leads, which uses the service-role client
-- (bypassing RLS deliberately and narrowly) and does its own validation +
-- rate limiting -- the same pattern already used by
-- src/app/api/broker/property-requests/[id]/client/route.ts.

create table if not exists investment_leads (
  id uuid primary key default gen_random_uuid(),
  purpose text check (purpose in ('end_use', 'investment', 'second_home', 'golden_visa')),
  budget_min numeric,
  budget_max numeric,
  community_id uuid references communities(id) on delete set null,
  purchase_timeline text,
  full_name text not null,
  email text not null,
  whatsapp text,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  -- Free-text, admin-set -- mirrors the existing leads.assigned_agent
  -- column exactly (schema.sql), the only "who's handling this" pattern
  -- that already exists anywhere in this codebase. Not a routing engine
  -- -- that's a separate, deliberately deferred piece of work.
  assigned_to text,
  source_path text,
  created_at timestamptz not null default now()
);
create index if not exists investment_leads_community_id_idx on investment_leads(community_id);
create index if not exists investment_leads_status_idx on investment_leads(status);

alter table investment_leads enable row level security;

drop policy if exists "investment_leads: admin reads all" on investment_leads;
create policy "investment_leads: admin reads all" on investment_leads for select using (is_admin());

drop policy if exists "investment_leads: admin updates all" on investment_leads;
create policy "investment_leads: admin updates all" on investment_leads for update using (is_admin()) with check (is_admin());

-- Deliberately no insert policy at all -- see header comment.

insert into platform_settings (key, label, value) values
  ('support_whatsapp_number', 'Support WhatsApp Number', '')
on conflict (key) do nothing;

-- The site's header nav is entirely admin-managed via nav_links
-- (patch_19, editable at /admin/menus) -- PublicShell.tsx reads real rows
-- from this table, never a hardcoded list (same precedent already
-- followed by patch_129_brokers_nav_link.sql). Highest existing header
-- sort_order is 8 ("Brokers").
insert into nav_links (label, url, location, sort_order)
select 'Invest', '/invest', 'header', 9
where not exists (
  select 1 from nav_links where location = 'header' and url = '/invest'
);

notify pgrst, 'reload schema';
