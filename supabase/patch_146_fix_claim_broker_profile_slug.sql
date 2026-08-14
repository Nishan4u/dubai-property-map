-- Fixes a real, reproducible bug on live broker onboarding:
--   "null value in column \"slug\" of relation \"brokers\" violates
--   not-null constraint"
--
-- Root cause: two DIFFERENT sessions independently re-created
-- claim_broker_profile() with two DIFFERENT parameter lists, and Postgres
-- allows function overloading by signature, so both versions now coexist
-- in the database instead of one replacing the other:
--   - patch_94_broker_referral_signups.sql: 8 params (..., p_brokerage_id,
--     p_referral_code default null) -- adds referral attribution, but was
--     written before slug generation existed, so it never sets `slug`.
--   - patch_127_broker_directory.sql: 7 params (..., p_brokerage_id) --
--     adds `update brokers set slug = generate_broker_slug(...)`, but its
--     own comment ("re-created with the CURRENT live signature (patch_66)")
--     wrongly assumed patch_66 was still current -- it didn't know patch_94
--     had already moved the signature to 8 params, so it created a SECOND
--     overload instead of replacing the first.
--
-- BrokerOnboarding.tsx (src/components/broker/BrokerOnboarding.tsx) calls
-- supabase.rpc("claim_broker_profile", { ...7 fields..., p_referral_code })
-- -- PostgREST resolves that call by matching the parameter list it was
-- given, so it always picks the 8-param (patch_94) overload, which is
-- exactly the one missing slug generation. This patch merges both
-- versions into ONE function with the referral logic AND the slug step,
-- and drops the stray duplicate so this ambiguity can't recur.
--
-- Prerequisite: patch_127_broker_directory.sql (adds `slug` and
-- generate_broker_slug()) and patch_94_broker_referral_signups.sql (adds
-- referral_code / broker_referral_signups) must already be applied --
-- both already are on this environment (that's exactly how this bug is
-- reachable live), so nothing here re-defines either.

drop function if exists claim_broker_profile(text, text, text, text, text, text, uuid);
drop function if exists claim_broker_profile(text, text, text, text, text, text, uuid, text);

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

  -- The fix: every earlier call site (both overloads) was missing this.
  update brokers set slug = generate_broker_slug(p_full_name, v_broker_id) where id = v_broker_id;

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

notify pgrst, 'reload schema';
