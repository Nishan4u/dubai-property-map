-- Staff Management: internal Dubai Property Map staff (not developers,
-- brokers, salespersons, or buyers) who earn commission for referring paid
-- subscribers. No public registration — admin creates every account and
-- privately shares the login path (/staff/login, not linked from any
-- public nav).

-- role is a native Postgres enum (user_role), not a check constraint —
-- extended the same way patch_29 added 'broker'/'salesperson'.
alter type user_role add value if not exists 'staff';

alter table profiles add column if not exists staff_id uuid;

create sequence if not exists staff_seq;

create table staff (
  id uuid primary key default gen_random_uuid(),
  staff_code text not null unique default ('DPM-ST-' || lpad(nextval('staff_seq')::text, 3, '0')),
  full_name text not null,
  email text not null unique,
  phone text,
  position text,
  joining_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  referral_code text not null unique,
  new_subscription_target int not null default 0,
  renewal_target int not null default 0,
  revenue_target numeric not null default 0,
  commission_type text not null default 'percentage' check (commission_type in ('percentage', 'flat')),
  commission_rate numeric not null default 0,
  login_enabled boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index staff_status_idx on staff(status);

alter table profiles add constraint profiles_staff_id_fkey
  foreign key (staff_id) references staff(id) on delete set null;

alter table staff enable row level security;
create policy "staff: self reads own" on staff for select using (
  id = (select staff_id from profiles where id = auth.uid())
);
create policy "staff: admin manages all" on staff for all using (is_admin()) with check (is_admin());

-- Historical monthly targets — admin can change a staff member's target at
-- any time, but past months keep whatever the target actually was, never
-- silently overwritten by a later change.
create table staff_monthly_targets (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  new_subscription_target int not null default 0,
  renewal_target int not null default 0,
  revenue_target numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (staff_id, year, month)
);

alter table staff_monthly_targets enable row level security;
create policy "staff_monthly_targets: self reads own" on staff_monthly_targets for select using (
  staff_id = (select staff_id from profiles where id = auth.uid())
);
create policy "staff_monthly_targets: admin manages all" on staff_monthly_targets for all using (is_admin()) with check (is_admin());

-- Attribution: which staff member gets credit for which customer. One row
-- per referred account, ever — the customer stays connected to the
-- original staff member across every future renewal, no re-entry of the
-- referral code required. Admin can repoint staff_id; every change is
-- expected to be paired with an audit_log entry by the route that does it.
create table staff_referrals (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id),
  referral_code text not null,
  account_type text not null check (account_type in ('developer', 'broker', 'salesperson')),
  developer_id uuid references developers(id) on delete cascade,
  broker_id uuid references brokers(id) on delete cascade,
  salesperson_id uuid references salespersons(id) on delete cascade,
  first_subscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint staff_referrals_account_match check (
    (account_type = 'developer' and developer_id is not null and broker_id is null and salesperson_id is null)
    or (account_type = 'broker' and broker_id is not null and developer_id is null and salesperson_id is null)
    or (account_type = 'salesperson' and salesperson_id is not null and developer_id is null and broker_id is null)
  )
);
create unique index staff_referrals_developer_unique on staff_referrals(developer_id) where developer_id is not null;
create unique index staff_referrals_broker_unique on staff_referrals(broker_id) where broker_id is not null;
create unique index staff_referrals_salesperson_unique on staff_referrals(salesperson_id) where salesperson_id is not null;
create index staff_referrals_staff_id_idx on staff_referrals(staff_id);

alter table staff_referrals enable row level security;
create policy "staff_referrals: self reads own" on staff_referrals for select using (
  staff_id = (select staff_id from profiles where id = auth.uid())
);
create policy "staff_referrals: admin manages all" on staff_referrals for all using (is_admin()) with check (is_admin());

-- The commission ledger. One row per eligible paid month — an expired,
-- unpaid month simply never gets a row (no commission), and a later
-- renewal creates a fresh row the moment it's paid, resuming commission
-- automatically. payment_id is unique so the same Stripe invoice or bank
-- transfer can never generate commission twice.
create table staff_commissions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id),
  referral_id uuid not null references staff_referrals(id),
  account_type text not null check (account_type in ('developer', 'broker', 'salesperson')),
  payment_id text not null unique,
  payment_source text not null check (payment_source in ('stripe', 'bank_transfer')),
  subscription_amount numeric not null,
  commission_amount numeric not null,
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid')),
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  paid_at timestamptz,
  paid_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index staff_commissions_staff_id_idx on staff_commissions(staff_id);
create index staff_commissions_period_idx on staff_commissions(period_year, period_month);

alter table staff_commissions enable row level security;
create policy "staff_commissions: self reads own" on staff_commissions for select using (
  staff_id = (select staff_id from profiles where id = auth.uid())
);
create policy "staff_commissions: admin manages all" on staff_commissions for all using (is_admin()) with check (is_admin());

revoke update, insert, delete on staff, staff_monthly_targets, staff_referrals, staff_commissions from authenticated;

-- Optional referral code capture on bank-transfer subscription submissions
-- too (Stripe checkout captures it via session metadata instead).
alter table subscription_bank_transfers add column if not exists referral_code text;
