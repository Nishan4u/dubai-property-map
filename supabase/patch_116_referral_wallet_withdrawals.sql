-- Broker/Salesperson Referral Program: cashback withdrawal requests. The
-- wallet balance could previously only ever be *spent* on a subscription
-- (used_for_renewal / used_for_new_subscription via /api/*/wallet/pay) --
-- there was no way to actually cash it out. This platform has no
-- automated outbound-payment rail (Stripe here is inbound-only, bank
-- transfers are user-initiated deposits an admin approves), so a real
-- payout is a manual, admin-mediated flow: the broker/salesperson submits
-- their bank details + an amount, an admin pays them via an actual bank
-- transfer outside this system, then marks the request paid here, which
-- deducts the wallet balance at that point (not at request time, so a
-- rejected request never touches the balance).

create table if not exists broker_referral_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('broker', 'salesperson')),
  broker_id uuid references brokers(id) on delete cascade,
  salesperson_id uuid references salespersons(id) on delete cascade,
  amount_aed numeric(10, 2) not null check (amount_aed > 0),
  bank_account_name text not null,
  bank_name text not null,
  bank_iban text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  wallet_transaction_id uuid references broker_referral_wallet_transactions(id),
  created_at timestamptz not null default now(),
  constraint broker_referral_withdrawal_requests_account_match check (
    (account_type = 'broker' and broker_id is not null and salesperson_id is null)
    or (account_type = 'salesperson' and salesperson_id is not null and broker_id is null)
  )
);
create index if not exists broker_referral_withdrawal_requests_broker_id_idx on broker_referral_withdrawal_requests(broker_id) where broker_id is not null;
create index if not exists broker_referral_withdrawal_requests_salesperson_id_idx on broker_referral_withdrawal_requests(salesperson_id) where salesperson_id is not null;
create index if not exists broker_referral_withdrawal_requests_status_idx on broker_referral_withdrawal_requests(status);

alter table broker_referral_withdrawal_requests enable row level security;
drop policy if exists "broker_referral_withdrawal_requests: owner reads own" on broker_referral_withdrawal_requests;
create policy "broker_referral_withdrawal_requests: owner reads own" on broker_referral_withdrawal_requests for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
  or salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
drop policy if exists "broker_referral_withdrawal_requests: admin reads all" on broker_referral_withdrawal_requests;
create policy "broker_referral_withdrawal_requests: admin reads all" on broker_referral_withdrawal_requests for select using (is_admin());
-- No insert/update/delete policy for any role -- creation and every status
-- transition goes through service-role library code
-- (src/lib/brokerReferrals.ts), which validates the requester actually
-- owns the account and that the amount doesn't exceed their available
-- balance, same reasoning as broker_referral_wallet_transactions.
revoke insert, update, delete on broker_referral_withdrawal_requests from authenticated;

-- Extend the wallet transaction ledger's allowed types with 'withdrawal'
-- (amount always positive, direction is decided by `type`, same as every
-- other row in this table).
alter table broker_referral_wallet_transactions drop constraint if exists broker_referral_wallet_transactions_type_check;
alter table broker_referral_wallet_transactions add constraint broker_referral_wallet_transactions_type_check check (type in (
  'cashback_earned', 'used_for_renewal', 'used_for_new_subscription',
  'admin_adjustment_credit', 'admin_adjustment_debit', 'clawback', 'withdrawal'
));

notify pgrst, 'reload schema';
