-- Upgrades the existing `brokerages` table (until now just a name label
-- auto-created by whatever a broker typed at onboarding, no login of its
-- own) into a full first-class account type: Broker Agency. A brokerage
-- row can now optionally have its own login, subscription and management
-- dashboard -- existing brokerage rows (auto-created, no login) keep
-- working exactly as they do today since every new column is nullable /
-- defaulted to match current behavior.
--
-- role is a native Postgres enum -- same ALTER TYPE pattern as every
-- other role added this project (patch_29, patch_55).
alter type user_role add value if not exists 'broker_agency';

alter table brokerages
  add column if not exists company_email text,
  add column if not exists phone text,
  add column if not exists contact_person text,
  add column if not exists office_details text,
  add column if not exists license_path text,
  add column if not exists plan_key text references subscription_plans(key),
  add column if not exists subscription_status text not null default 'no_subscription'
    check (subscription_status in ('no_subscription', 'payment_pending', 'active', 'expired', 'cancelled', 'payment_failed')),
  add column if not exists is_complimentary boolean not null default false,
  add column if not exists subscription_expires_at date,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists payment_type text check (payment_type in ('stripe', 'bank_transfer', 'admin_free'));
create unique index if not exists brokerages_company_email_uidx on brokerages (lower(company_email)) where company_email is not null;

alter table profiles add column if not exists broker_agency_id uuid;
alter table profiles add constraint profiles_broker_agency_id_fkey
  foreign key (broker_agency_id) references brokerages(id) on delete set null;
-- Identity-defining, same convention as broker_id/salesperson_id above it
-- in patch_30 -- only server-side (service-role) code may set this.
revoke update (broker_agency_id) on profiles from authenticated;

create policy "brokerages: owner reads own" on brokerages for select using (
  id = (select broker_agency_id from profiles where id = auth.uid())
);
create policy "brokerages: owner updates own profile fields" on brokerages for update using (
  id = (select broker_agency_id from profiles where id = auth.uid())
) with check (
  id = (select broker_agency_id from profiles where id = auth.uid())
);
-- Admin-only / server-only columns, same convention as brokers above.
revoke update (
  verified, plan_key, subscription_status, is_complimentary, subscription_expires_at,
  stripe_customer_id, stripe_subscription_id, payment_type
) on brokerages from authenticated;

-- ---------- Brokers: agency becomes optional (independent brokers) ----------
alter table brokers alter column brokerage_id drop not null;
alter table brokers
  add column if not exists license_path text,
  add column if not exists license_status text not null default 'pending'
    check (license_status in ('pending', 'approved', 'rejected'));
-- An independent broker (no agency) must have a license on file; an
-- agency-linked broker's license is optional (the agency's own license
-- covers them). Enforced here so this can never regress silently.
alter table brokers add constraint brokers_independent_requires_license
  check (brokerage_id is not null or license_path is not null);

-- An agency can see its own roster (view/search/status -- the
-- remove/disconnect action ships in a follow-up patch alongside the rest
-- of the agency dashboard).
create policy "brokers: agency reads own roster" on brokers for select using (
  brokerage_id = (select broker_agency_id from profiles where id = auth.uid())
);

-- ---------- History: keep every past agency/developer relationship ----------
-- Broker <-> Agency and Salesperson <-> Developer can both change over
-- time (resignation, moving companies) while the underlying subscription
-- stays untouched -- these are pure audit trails, never read for access
-- control.
create table broker_agency_history (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references brokers(id) on delete cascade,
  brokerage_id uuid references brokerages(id) on delete set null,
  became_independent boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index broker_agency_history_broker_id_idx on broker_agency_history(broker_id);

alter table broker_agency_history enable row level security;
create policy "broker_agency_history: broker reads own" on broker_agency_history for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "broker_agency_history: admin manages all" on broker_agency_history for all using (is_admin()) with check (is_admin());

create table salesperson_developer_history (
  id uuid primary key default gen_random_uuid(),
  salesperson_id uuid not null references salespersons(id) on delete cascade,
  developer_id uuid references developers(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index salesperson_developer_history_salesperson_id_idx on salesperson_developer_history(salesperson_id);

alter table salesperson_developer_history enable row level security;
create policy "salesperson_developer_history: self reads own" on salesperson_developer_history for select using (
  salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "salesperson_developer_history: admin manages all" on salesperson_developer_history for all using (is_admin()) with check (is_admin());

insert into registration_type_settings (account_type, enabled) values ('broker_agency', true) on conflict (account_type) do nothing;

-- ---------- Self-service broker agency claim RPC ----------
-- Unlike brokers (which get-or-create a brokerage row by free-text NAME
-- match, so two people typing the same name silently share one row),
-- every field here was already collected server-side at registration
-- (see /api/auth/register) and stored on the auth user's metadata, so
-- this always creates a fresh, dedicated brokerages row for this account
-- -- no name-matching, no merge-by-accident. Runs the first time the
-- agency reaches its dashboard post-verification, same "claim on first
-- load" convention as claim_salesperson_profile.
create or replace function claim_broker_agency_profile(
  p_agency_name text,
  p_phone text,
  p_contact_person text,
  p_office_details text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_agency_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  if (select role from profiles where id = auth.uid()) <> 'broker_agency' then
    raise exception 'Only a broker-agency-role account can register an agency.';
  end if;

  if (select broker_agency_id from profiles where id = auth.uid()) is not null then
    raise exception 'This account is already linked to an agency profile.';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  insert into brokerages (name, company_email, phone, contact_person, office_details)
  values (trim(p_agency_name), v_email, p_phone, p_contact_person, p_office_details)
  returning id into v_agency_id;

  update profiles set broker_agency_id = v_agency_id where id = auth.uid();

  return v_agency_id;
end;
$$;

grant execute on function claim_broker_agency_profile(text, text, text, text) to authenticated;
