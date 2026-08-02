-- Broker/Salesperson Referral Program (Sections 3, 9, 14, 15): the
-- attribution/lifecycle table, one row per referred (referee) account,
-- created atomically inside the same self-registration RPC that creates
-- the account itself -- mirrors staff_referrals' shape (patch_55) but is
-- a distinct table/concept, see patch_92's header comment.

create table broker_referral_signups (
  id uuid primary key default gen_random_uuid(),
  referrer_account_type text not null check (referrer_account_type in ('broker', 'salesperson')),
  referrer_broker_id uuid references brokers(id) on delete cascade,
  referrer_salesperson_id uuid references salespersons(id) on delete cascade,
  referral_code_used text not null, -- snapshot, survives later code revocation
  referee_account_type text not null check (referee_account_type in ('broker', 'salesperson')),
  referee_broker_id uuid references brokers(id) on delete cascade,
  referee_salesperson_id uuid references salespersons(id) on delete cascade,
  status text not null default 'pending_subscription'
    check (status in ('pending_subscription', 'paid_awaiting_activation', 'completed', 'disqualified', 'expired')),
  discount_percent_applied numeric(5, 2),
  discount_amount_aed numeric(10, 2),
  plan_key text references subscription_plans(key),
  payment_source text check (payment_source in ('stripe', 'bank_transfer')),
  payment_reference text,
  subscription_amount_aed numeric(10, 2),
  activated_at timestamptz,
  cashback_amount_aed numeric(10, 2),
  cashback_credited_at timestamptz,
  cashback_reversed_at timestamptz,
  disqualified_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broker_referral_signups_referrer_match check (
    (referrer_account_type = 'broker' and referrer_broker_id is not null and referrer_salesperson_id is null)
    or (referrer_account_type = 'salesperson' and referrer_salesperson_id is not null and referrer_broker_id is null)
  ),
  constraint broker_referral_signups_referee_match check (
    (referee_account_type = 'broker' and referee_broker_id is not null and referee_salesperson_id is null)
    or (referee_account_type = 'salesperson' and referee_salesperson_id is not null and referee_broker_id is null)
  )
);
-- One referral row per referee, ever -- this is what actually enforces
-- "one-time reward only" even if allow_reward_on_resubscription is on
-- (that setting governs whether a *fresh* signup row could be created for
-- the same person under a different account, not this table directly).
create unique index broker_referral_signups_referee_broker_unique on broker_referral_signups(referee_broker_id) where referee_broker_id is not null;
create unique index broker_referral_signups_referee_salesperson_unique on broker_referral_signups(referee_salesperson_id) where referee_salesperson_id is not null;
create index broker_referral_signups_referrer_broker_idx on broker_referral_signups(referrer_broker_id) where referrer_broker_id is not null;
create index broker_referral_signups_referrer_salesperson_idx on broker_referral_signups(referrer_salesperson_id) where referrer_salesperson_id is not null;

alter table broker_referral_signups enable row level security;
create policy "broker_referral_signups: referrer reads own" on broker_referral_signups for select using (
  referrer_broker_id = (select broker_id from profiles where id = auth.uid())
  or referrer_salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
create policy "broker_referral_signups: referee reads own" on broker_referral_signups for select using (
  referee_broker_id = (select broker_id from profiles where id = auth.uid())
  or referee_salesperson_id = (select salesperson_id from profiles where id = auth.uid())
);
-- select-only for admin, deliberately not "for all" -- every write to
-- this table happens either through claim_*_profile (security definer,
-- bypasses grants) or service-role library code
-- (src/lib/brokerReferrals.ts, bypasses RLS entirely), never a direct
-- authenticated-role write, so an insert/update/delete admin policy here
-- would just be unreachable dead code once the blanket revoke below is
-- in place (the same Postgres role, authenticated, is what both regular
-- users and admins run as -- REVOKE at the role level blocks admins too,
-- same reason GrantSubscriptionForm needs a service-role route instead
-- of a direct RLS-permitted write).
create policy "broker_referral_signups: admin reads all" on broker_referral_signups for select using (is_admin());
revoke insert, update, delete on broker_referral_signups from authenticated;

-- ---------- claim_broker_profile: add optional referral code capture ----------
drop function if exists claim_broker_profile(text, text, text, text, text, text, uuid);

create or replace function claim_broker_profile(
  p_full_name text,
  p_brn text,
  p_orn text,
  p_email text,
  p_mobile text,
  p_whatsapp text,
  p_brokerage_id uuid,
  p_referral_code text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_broker_id uuid;
  v_ref_broker_id uuid;
  v_ref_email text;
  v_ref_mobile text;
  v_ref_status text;
  v_ref_expires timestamptz;
  v_ref_sp_id uuid;
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

  if p_brokerage_id is not null and not exists (select 1 from brokerages where id = p_brokerage_id) then
    raise exception 'Selected agency not found.';
  end if;

  insert into brokers (brokerage_id, full_name, brn, orn, email, mobile, whatsapp)
  values (p_brokerage_id, p_full_name, p_brn, p_orn, p_email, p_mobile, p_whatsapp)
  returning id into v_broker_id;

  update profiles set broker_id = v_broker_id where id = auth.uid();

  insert into broker_agency_history (broker_id, brokerage_id, became_independent)
  values (v_broker_id, p_brokerage_id, p_brokerage_id is null);

  -- Referral attribution -- best-effort: an invalid/expired/self-referral
  -- code never blocks registration itself, it just means no attribution
  -- row gets created (spec item 3: the field is optional, entering a bad
  -- code shouldn't lock a real person out of signing up).
  if p_referral_code is not null and trim(p_referral_code) <> '' then
    select id, email, mobile, referral_code_status, referral_code_expires_at
      into v_ref_broker_id, v_ref_email, v_ref_mobile, v_ref_status, v_ref_expires
      from brokers where referral_code = trim(p_referral_code);

    if v_ref_broker_id is not null then
      if v_ref_status = 'active'
        and (v_ref_expires is null or v_ref_expires > now())
        and lower(v_ref_email) <> lower(p_email)
        and (v_ref_mobile is null or p_mobile is null or v_ref_mobile <> p_mobile)
      then
        insert into broker_referral_signups (
          referrer_account_type, referrer_broker_id, referral_code_used,
          referee_account_type, referee_broker_id
        ) values ('broker', v_ref_broker_id, trim(p_referral_code), 'broker', v_broker_id);
      end if;
    else
      select id, email, mobile, referral_code_status, referral_code_expires_at
        into v_ref_sp_id, v_ref_email, v_ref_mobile, v_ref_status, v_ref_expires
        from salespersons where referral_code = trim(p_referral_code);

      if v_ref_sp_id is not null
        and v_ref_status = 'active'
        and (v_ref_expires is null or v_ref_expires > now())
        and lower(v_ref_email) <> lower(p_email)
        and (v_ref_mobile is null or p_mobile is null or v_ref_mobile <> p_mobile)
      then
        insert into broker_referral_signups (
          referrer_account_type, referrer_salesperson_id, referral_code_used,
          referee_account_type, referee_broker_id
        ) values ('salesperson', v_ref_sp_id, trim(p_referral_code), 'broker', v_broker_id);
      end if;
    end if;
  end if;

  return v_broker_id;
end;
$$;

grant execute on function claim_broker_profile(text, text, text, text, text, text, uuid, text) to authenticated;

-- ---------- claim_salesperson_profile: same addition ----------
drop function if exists claim_salesperson_profile(uuid, text, text, text, text, text);

create or replace function claim_salesperson_profile(
  p_developer_id uuid,
  p_full_name text,
  p_job_title text,
  p_employee_id text,
  p_mobile text,
  p_whatsapp text,
  p_referral_code text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
  v_email text;
  v_salesperson_id uuid;
  v_ref_broker_id uuid;
  v_ref_sp_id uuid;
  v_ref_email text;
  v_ref_mobile text;
  v_ref_status text;
  v_ref_expires timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  if (select role from profiles where id = auth.uid()) <> 'salesperson' then
    raise exception 'Only a salesperson-role account can complete this registration.';
  end if;

  if (select salesperson_id from profiles where id = auth.uid()) is not null then
    raise exception 'This account is already linked to a salesperson profile.';
  end if;

  select approved_email_domain into v_domain from developers where id = p_developer_id;
  if v_domain is null or trim(v_domain) = '' then
    raise exception 'This developer has not configured salesperson email verification yet.';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if v_email is null or lower(split_part(v_email, '@', 2)) <> lower(trim(leading '@' from v_domain)) then
    raise exception 'Your account email does not match this developer''s approved domain.';
  end if;

  insert into salespersons (developer_id, full_name, job_title, employee_id, email, mobile, whatsapp, status, created_by)
  values (p_developer_id, p_full_name, p_job_title, p_employee_id, v_email, p_mobile, p_whatsapp, 'active', auth.uid())
  returning id into v_salesperson_id;

  update profiles set salesperson_id = v_salesperson_id where id = auth.uid();

  if p_referral_code is not null and trim(p_referral_code) <> '' then
    select id, email, mobile, referral_code_status, referral_code_expires_at
      into v_ref_broker_id, v_ref_email, v_ref_mobile, v_ref_status, v_ref_expires
      from brokers where referral_code = trim(p_referral_code);

    if v_ref_broker_id is not null then
      if v_ref_status = 'active'
        and (v_ref_expires is null or v_ref_expires > now())
        and lower(v_ref_email) <> lower(v_email)
        and (v_ref_mobile is null or p_mobile is null or v_ref_mobile <> p_mobile)
      then
        insert into broker_referral_signups (
          referrer_account_type, referrer_broker_id, referral_code_used,
          referee_account_type, referee_salesperson_id
        ) values ('broker', v_ref_broker_id, trim(p_referral_code), 'salesperson', v_salesperson_id);
      end if;
    else
      select id, email, mobile, referral_code_status, referral_code_expires_at
        into v_ref_sp_id, v_ref_email, v_ref_mobile, v_ref_status, v_ref_expires
        from salespersons where referral_code = trim(p_referral_code);

      if v_ref_sp_id is not null
        and v_ref_status = 'active'
        and (v_ref_expires is null or v_ref_expires > now())
        and lower(v_ref_email) <> lower(v_email)
        and (v_ref_mobile is null or p_mobile is null or v_ref_mobile <> p_mobile)
      then
        insert into broker_referral_signups (
          referrer_account_type, referrer_salesperson_id, referral_code_used,
          referee_account_type, referee_salesperson_id
        ) values ('salesperson', v_ref_sp_id, trim(p_referral_code), 'salesperson', v_salesperson_id);
      end if;
    end if;
  end if;

  return v_salesperson_id;
end;
$$;

grant execute on function claim_salesperson_profile(uuid, text, text, text, text, text, text) to authenticated;

-- Lightweight live-validation lookup for the registration form (spec item
-- 3: "validates it before payment" -- this gives immediate "valid code
-- from X" / "code not found" feedback at registration time, without
-- exposing full broker/salesperson rows to a stranger typing a code).
-- Returns the referrer's display name, or null if the code doesn't
-- resolve to an active, non-expired code.
create or replace function check_broker_referral_code(p_code text) returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if p_code is null or trim(p_code) = '' then
    return null;
  end if;

  select full_name into v_name from brokers
    where referral_code = trim(p_code) and referral_code_status = 'active'
    and (referral_code_expires_at is null or referral_code_expires_at > now());
  if v_name is not null then
    return v_name;
  end if;

  select full_name into v_name from salespersons
    where referral_code = trim(p_code) and referral_code_status = 'active'
    and (referral_code_expires_at is null or referral_code_expires_at > now());
  return v_name;
end;
$$;

grant execute on function check_broker_referral_code(text) to anon, authenticated;

notify pgrst, 'reload schema';
