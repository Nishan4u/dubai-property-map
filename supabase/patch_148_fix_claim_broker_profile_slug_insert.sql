-- Fixes patch_146's fix, which was itself incomplete.
--
-- Root cause (confirmed live on production via a diagnostic query showing
-- exactly ONE claim_broker_profile() overload exists, and it DOES contain
-- 'slug' in its body -- so patch_146 was applied correctly, and the
-- overload-ambiguity bug it targeted is genuinely gone):
--
-- patch_146's function still failed the exact same
-- `null value in column "slug" of relation "brokers" violates not-null
-- constraint` error, because of a sequencing bug in patch_146 itself:
--
--   insert into brokers (brokerage_id, full_name, brn, orn, email, mobile, whatsapp)
--   values (...)
--   returning id into v_broker_id;
--
--   update brokers set slug = generate_broker_slug(p_full_name, v_broker_id)
--     where id = v_broker_id;
--
-- `brokers.slug` is `not null` with no default (patch_127). The INSERT
-- above never includes a `slug` value, so Postgres rejects the INSERT
-- itself before the function ever reaches the UPDATE line that was
-- supposed to fix it -- the UPDATE is unreachable dead code as written.
-- generate_broker_slug() also needs the broker's own `id` to build the
-- slug's suffix, which doesn't exist until after the (failing) insert --
-- that's why the original author reached for an update-after-insert
-- shape in the first place.
--
-- Fix: generate the id up front (brokers.id has no server-side identity
-- requirement beyond its `default gen_random_uuid()`, so supplying it
-- explicitly is safe) and include the computed slug directly in the
-- INSERT's column list -- one statement, no follow-up UPDATE needed.
-- Every other part of the function (referral attribution, agency
-- history, profile linking) is unchanged from patch_146.

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

  -- Generate the id up front so the slug (which is derived from it) can
  -- be set in the same INSERT -- slug is not-null, so a two-step
  -- insert-then-update (patch_146's approach) can never work: the insert
  -- itself is rejected before any update statement runs.
  v_broker_id := gen_random_uuid();

  insert into brokers (id, brokerage_id, full_name, brn, orn, email, mobile, whatsapp, slug)
  values (
    v_broker_id, p_brokerage_id, p_full_name, p_brn, p_orn, p_email, p_mobile, p_whatsapp,
    generate_broker_slug(p_full_name, v_broker_id)
  );

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
