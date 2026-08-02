-- Broker/Salesperson Referral Program (Section 10: Admin Referral Settings).
-- Singleton config table, same convention as site_access_settings
-- (patch_85) -- a flat set of admin-tunable knobs, public-read since the
-- discount % needs to be visible on the public registration page and the
-- broker/salesperson referral dashboards, admin-only write.
--
-- Deliberately named broker_referral_* everywhere in this feature, never
-- bare referral_* -- there's already an unrelated internal DPM-staff
-- commission-tracking system using that name (src/lib/referrals.ts,
-- patch_55/56) with its own staff/staff_referrals/staff_commissions
-- tables. This is a different concept (brokers/salespersons earning
-- cashback for recruiting other brokers/salespersons), not staff earning
-- commission on any signup -- keeping the prefix distinct avoids any
-- collision or confusion between the two.
create table broker_referral_settings (
  id boolean primary key default true check (id),
  program_enabled boolean not null default true,
  broker_code_prefix text not null default 'BRK',
  salesperson_code_prefix text not null default 'SP',
  code_expiry_days int, -- null = never expires
  allow_reward_on_resubscription boolean not null default false,
  discount_enabled boolean not null default true,
  discount_percent numeric(5, 2) not null default 15.00 check (discount_percent between 0 and 100),
  discount_eligible_plan_keys text[], -- null = all broker/salesperson plans
  discount_first_subscription_only boolean not null default true,
  cashback_enabled boolean not null default true,
  cashback_amount_aed numeric(10, 2) not null default 10.00 check (cashback_amount_aed >= 0),
  cashback_eligible_account_types text[] not null default '{broker,salesperson}',
  cashback_min_subscription_amount_aed numeric(10, 2), -- null = no minimum
  wallet_new_purchase_enabled boolean not null default false, -- renewals can always use wallet (spec item 6); this only gates non-renewal use
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

alter table broker_referral_settings enable row level security;
create policy "broker_referral_settings: public read" on broker_referral_settings for select using (true);
create policy "broker_referral_settings: admin manages" on broker_referral_settings for all using (is_admin()) with check (is_admin());

insert into broker_referral_settings (id) values (true)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
