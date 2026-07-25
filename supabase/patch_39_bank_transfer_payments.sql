-- Bank Transfer as an alternative to Stripe for developer and broker
-- subscriptions. A submission never auto-activates a plan — it sits at
-- 'verification_pending' until an admin approves or rejects it (see
-- src/app/api/admin/bank-transfers/[id]/approve and /reject).
--
-- Run this AFTER creating a bucket named "payment-receipts" in the
-- Supabase dashboard (Storage -> New bucket -> name: payment-receipts ->
-- Public bucket: OFF — these are financial documents, not public assets).
-- Path convention: payment-receipts/{developer_id-or-broker_id}/{timestamp}-{name}

insert into platform_settings (key, label, value) values
  ('bank_transfer_bank_name', 'Bank Transfer: Bank Name', ''),
  ('bank_transfer_account_name', 'Bank Transfer: Account Name', ''),
  ('bank_transfer_account_number', 'Bank Transfer: Account Number', ''),
  ('bank_transfer_iban', 'Bank Transfer: IBAN', ''),
  ('bank_transfer_swift', 'Bank Transfer: SWIFT/BIC', '')
on conflict (key) do nothing;

create table subscription_bank_transfers (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('developer', 'broker')),
  developer_id uuid references developers(id) on delete cascade,
  broker_id uuid references brokers(id) on delete cascade,
  plan_key text not null references subscription_plans(key),
  amount_aed numeric not null,
  receipt_url text not null,
  transaction_reference text,
  transfer_date date,
  note text,
  status text not null default 'verification_pending'
    check (status in ('verification_pending', 'paid', 'rejected')),
  rejection_reason text,
  submitted_by uuid not null references profiles(id),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint subscription_bank_transfers_account_match check (
    (account_type = 'developer' and developer_id is not null and broker_id is null) or
    (account_type = 'broker' and broker_id is not null and developer_id is null)
  )
);
create index subscription_bank_transfers_developer_id_idx on subscription_bank_transfers(developer_id);
create index subscription_bank_transfers_broker_id_idx on subscription_bank_transfers(broker_id);

alter table subscription_bank_transfers enable row level security;

create policy "subscription_bank_transfers: developer reads own" on subscription_bank_transfers
  for select using (developer_id = (select developer_id from profiles where id = auth.uid()));

create policy "subscription_bank_transfers: developer submits own" on subscription_bank_transfers
  for insert with check (
    account_type = 'developer'
    and developer_id = (select developer_id from profiles where id = auth.uid())
    and submitted_by = auth.uid()
  );

create policy "subscription_bank_transfers: broker reads own" on subscription_bank_transfers
  for select using (broker_id = (select broker_id from profiles where id = auth.uid()));

create policy "subscription_bank_transfers: broker submits own" on subscription_bank_transfers
  for insert with check (
    account_type = 'broker'
    and broker_id = (select broker_id from profiles where id = auth.uid())
    and submitted_by = auth.uid()
  );

create policy "subscription_bank_transfers: admin manages all" on subscription_bank_transfers
  for all using (is_admin()) with check (is_admin());

-- Storage: owner uploads/reads their own receipts, admin reads all.
create policy "payment-receipts: developer uploads own"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1]::uuid = (select developer_id from profiles where id = auth.uid())
  );

create policy "payment-receipts: developer reads own"
  on storage.objects for select
  using (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1]::uuid = (select developer_id from profiles where id = auth.uid())
  );

create policy "payment-receipts: broker uploads own"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1]::uuid = (select broker_id from profiles where id = auth.uid())
  );

create policy "payment-receipts: broker reads own"
  on storage.objects for select
  using (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1]::uuid = (select broker_id from profiles where id = auth.uid())
  );

create policy "payment-receipts: admin reads all"
  on storage.objects for select
  using (bucket_id = 'payment-receipts' and is_admin());
