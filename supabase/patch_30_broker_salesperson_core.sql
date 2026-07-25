-- Broker / Salesperson core schema. Run only after patch_29 has
-- succeeded (needs the new 'broker'/'salesperson' enum values committed).
--
-- Two existing tables are deliberately NOT touched by this feature:
--   - team_members: existing developer contact list, no login, still used
--     for "Assign Agent" on the existing buyer-facing `leads` table.
--   - leads: existing top-of-funnel buyer enquiry capture (has a client
--     name) — a completely different concept from `property_requests`
--     below, which must never collect client identity.

-- ---------- Brokerages ----------
create table brokerages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index brokerages_name_lower_uidx on brokerages (lower(name));

alter table brokerages enable row level security;
create policy "brokerages: public read" on brokerages for select using (true);
create policy "brokerages: admin manages" on brokerages for all using (is_admin()) with check (is_admin());
-- No client-facing insert policy: brokerages are only ever created via the
-- claim_broker_profile() RPC below (security definer, bypasses RLS) or by
-- an admin, never by a raw authenticated insert.

-- ---------- Brokers ----------
create table brokers (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references brokerages(id) on delete restrict,
  full_name text not null,
  brn text not null,
  orn text not null,
  email text not null,
  mobile text not null,
  whatsapp text not null,
  photo_url text,
  rera_card_path text,
  account_status text not null default 'pending_verification'
    check (account_status in ('pending_verification','approved','rejected','suspended','blocked')),
  rejection_reason text,
  suspension_reason text,
  plan_key text references subscription_plans(key),
  subscription_status text not null default 'no_subscription'
    check (subscription_status in ('no_subscription','payment_pending','active','expired','cancelled','payment_failed')),
  is_complimentary boolean not null default false,
  subscription_expires_at date,
  last_reminder_sent_days int,
  stripe_customer_id text,
  stripe_subscription_id text,
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index brokers_brokerage_id_idx on brokers(brokerage_id);

alter table profiles add column broker_id uuid;
alter table profiles add column salesperson_id uuid;
alter table profiles add constraint profiles_broker_id_fkey
  foreign key (broker_id) references brokers(id) on delete set null;

alter table brokers enable row level security;
create policy "brokers: owner reads own" on brokers for select using (
  id = (select broker_id from profiles where id = auth.uid())
);
create policy "brokers: owner updates own profile fields" on brokers for update using (
  id = (select broker_id from profiles where id = auth.uid())
) with check (
  id = (select broker_id from profiles where id = auth.uid())
);
create policy "brokers: admin manages all" on brokers for all using (is_admin()) with check (is_admin());
-- No client-facing insert policy — brokers are only ever created via the
-- claim_broker_profile() RPC below, never a raw authenticated insert
-- (prevents anyone from inserting an already-'approved' broker row).

-- Admin-only / server-only columns: a broker editing "own profile fields"
-- above must never be able to approve themselves, forge a subscription, or
-- rewrite their own Stripe linkage — same convention as
-- patch_10_subscriptions.sql's revoke on developers.plan_tier etc.
revoke update (
  account_status, rejection_reason, suspension_reason, plan_key, subscription_status,
  is_complimentary, subscription_expires_at, last_reminder_sent_days,
  stripe_customer_id, stripe_subscription_id, approved_at, approved_by
) on brokers from authenticated;

-- profiles.broker_id / salesperson_id are identity-defining for RLS
-- everywhere else in this feature (whoever holds broker_id = X *is*
-- broker X). Unlike profiles.developer_id (which this app already lets a
-- user set on themselves directly, self-service), these two must never be
-- settable by a plain client update — only claim_broker_profile() (self,
-- but tightly scoped) or the admin/developer salesperson-creation routes
-- (service-role, bypasses RLS/grants entirely) may set them.
revoke update (broker_id, salesperson_id) on profiles from authenticated;

-- ---------- Salespersons ----------
create table salespersons (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references developers(id) on delete cascade,
  full_name text not null,
  job_title text,
  employee_id text,
  email text not null,
  mobile text,
  whatsapp text,
  photo_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index salespersons_developer_id_idx on salespersons(developer_id);

alter table profiles add constraint profiles_salesperson_id_fkey
  foreign key (salesperson_id) references salespersons(id) on delete set null;

alter table salespersons enable row level security;
create policy "salespersons: self reads own" on salespersons for select using (
  id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "salespersons: developer reads own roster" on salespersons for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "salespersons: developer updates own roster" on salespersons for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "salespersons: broker reads active roster" on salespersons for select using (
  status = 'active'
  and exists (select 1 from profiles where id = auth.uid() and role = 'broker')
);
create policy "salespersons: admin manages all" on salespersons for all using (is_admin()) with check (is_admin());
-- No client-facing insert policy — created only via the service-role
-- /api/admin/salespersons/create route (mirrors admin-creates-developer).

-- ---------- Broker <-> Salesperson "remembered" relationship ----------
create table broker_salesperson_relationships (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references brokers(id) on delete cascade,
  developer_id uuid not null references developers(id) on delete cascade,
  salesperson_id uuid not null references salespersons(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (broker_id, developer_id)
);

alter table broker_salesperson_relationships enable row level security;
create policy "broker_salesperson_relationships: broker manages own" on broker_salesperson_relationships for all using (
  broker_id = (select broker_id from profiles where id = auth.uid())
) with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
  and salesperson_id in (select id from salespersons where developer_id = broker_salesperson_relationships.developer_id and status = 'active')
);
create policy "broker_salesperson_relationships: developer reads own company rows" on broker_salesperson_relationships for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "broker_salesperson_relationships: salesperson reads own" on broker_salesperson_relationships for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "broker_salesperson_relationships: admin manages all" on broker_salesperson_relationships for all using (is_admin()) with check (is_admin());

-- ---------- Self-service broker registration RPC ----------
-- Runs as a security-definer function (same pattern as handle_new_user()
-- and is_admin() elsewhere in this schema) so it can safely perform the
-- brokerage get-or-create + brokers insert + profiles.broker_id link as
-- one atomic, tightly-scoped operation, without ever needing a raw
-- client-facing insert/update policy that a malicious user could widen.
create or replace function claim_broker_profile(
  p_brokerage_name text,
  p_full_name text,
  p_brn text,
  p_orn text,
  p_email text,
  p_mobile text,
  p_whatsapp text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brokerage_id uuid;
  v_broker_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  if (select role from profiles where id = auth.uid()) <> 'broker' then
    raise exception 'Only a broker-role account can register a brokerage.';
  end if;

  if (select broker_id from profiles where id = auth.uid()) is not null then
    raise exception 'This account is already linked to a broker profile.';
  end if;

  select id into v_brokerage_id from brokerages where lower(name) = lower(trim(p_brokerage_name));
  if v_brokerage_id is null then
    insert into brokerages (name) values (trim(p_brokerage_name)) returning id into v_brokerage_id;
  end if;

  insert into brokers (brokerage_id, full_name, brn, orn, email, mobile, whatsapp)
  values (v_brokerage_id, p_full_name, p_brn, p_orn, p_email, p_mobile, p_whatsapp)
  returning id into v_broker_id;

  update profiles set broker_id = v_broker_id where id = auth.uid();

  return v_broker_id;
end;
$$;

grant execute on function claim_broker_profile(text, text, text, text, text, text, text) to authenticated;
