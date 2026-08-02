-- Broker/Salesperson Referral Program (Sections 5-7): per-account Referral
-- Wallet + an append-only transaction ledger. The ledger is the source of
-- truth for history/audit; balance_aed on the wallet row is a
-- denormalized running total kept in sync by the service-role library
-- functions in src/lib/brokerReferrals.ts (never updated directly by a
-- client -- see the revoke below).

create table broker_referral_wallets (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('broker', 'salesperson')),
  broker_id uuid unique references brokers(id) on delete cascade,
  salesperson_id uuid unique references salespersons(id) on delete cascade,
  balance_aed numeric(10, 2) not null default 0 check (balance_aed >= 0),
  total_earned_aed numeric(10, 2) not null default 0,
  total_used_aed numeric(10, 2) not null default 0,
  pending_aed numeric(10, 2) not null default 0, -- cashback for signups still in paid_awaiting_activation
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broker_referral_wallets_account_match check (
    (account_type = 'broker' and broker_id is not null and salesperson_id is null)
    or (account_type = 'salesperson' and salesperson_id is not null and broker_id is null)
  )
);

alter table broker_referral_wallets enable row level security;
create policy "broker_referral_wallets: owner reads own" on broker_referral_wallets for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
  or salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
-- select-only for admin (see patch_94's comment on the same pattern) --
-- every write goes through service-role library code, a manual admin
-- credit/debit needs a service-role API route if that action is ever
-- built, not a direct RLS-permitted write.
create policy "broker_referral_wallets: admin reads all" on broker_referral_wallets for select using (is_admin());
revoke insert, update, delete on broker_referral_wallets from authenticated;

create table broker_referral_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references broker_referral_wallets(id) on delete cascade,
  type text not null check (type in (
    'cashback_earned', 'used_for_renewal', 'used_for_new_subscription',
    'admin_adjustment_credit', 'admin_adjustment_debit', 'clawback'
  )),
  amount_aed numeric(10, 2) not null, -- always positive; `type` decides credit/debit direction
  referral_signup_id uuid references broker_referral_signups(id),
  related_payment_type text check (related_payment_type in ('stripe', 'bank_transfer')),
  plan_key text references subscription_plans(key),
  note text,
  created_by uuid references profiles(id), -- admin id for manual adjustments, null = system
  created_at timestamptz not null default now()
);
-- One cashback payout per referral signup, ever -- idempotent under
-- webhook retries, same pattern as staff_commissions.payment_id.
create unique index broker_referral_wallet_tx_cashback_unique on broker_referral_wallet_transactions(referral_signup_id) where type = 'cashback_earned';
create index broker_referral_wallet_tx_wallet_idx on broker_referral_wallet_transactions(wallet_id);

alter table broker_referral_wallet_transactions enable row level security;
create policy "broker_referral_wallet_transactions: owner reads own" on broker_referral_wallet_transactions for select using (
  wallet_id in (
    select id from broker_referral_wallets
    where broker_id = (select broker_id from profiles where id = auth.uid())
    or salesperson_id = (select salesperson_id from profiles where id = auth.uid())
  )
);
create policy "broker_referral_wallet_transactions: admin reads all" on broker_referral_wallet_transactions for select using (is_admin());
revoke insert, update, delete on broker_referral_wallet_transactions from authenticated;

-- One wallet per existing broker/salesperson, created up front so the
-- dashboard/checkout code can always assume a wallet row exists rather
-- than handling a "no wallet yet" branch everywhere.
insert into broker_referral_wallets (account_type, broker_id)
select 'broker', id from brokers
where not exists (select 1 from broker_referral_wallets w where w.broker_id = brokers.id);

insert into broker_referral_wallets (account_type, salesperson_id)
select 'salesperson', id from salespersons
where not exists (select 1 from broker_referral_wallets w where w.salesperson_id = salespersons.id);

-- New brokers/salespersons need a wallet too -- same trigger-based
-- guarantee as referral code generation (patch_93), so nothing ever has
-- to remember to create one.
create or replace function create_broker_referral_wallet() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into broker_referral_wallets (account_type, broker_id) values ('broker', new.id)
    on conflict (broker_id) do nothing;
  return new;
end;
$$;

create trigger brokers_create_referral_wallet
  after insert on brokers
  for each row execute function create_broker_referral_wallet();

create or replace function create_salesperson_referral_wallet() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into broker_referral_wallets (account_type, salesperson_id) values ('salesperson', new.id)
    on conflict (salesperson_id) do nothing;
  return new;
end;
$$;

create trigger salespersons_create_referral_wallet
  after insert on salespersons
  for each row execute function create_salesperson_referral_wallet();

notify pgrst, 'reload schema';
