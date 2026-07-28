-- Broker registration: agency becomes a real selection from registered
-- Broker Agency accounts (not a free-text name that silently
-- get-or-creates a bare label anymore), or explicitly Independent with a
-- mandatory license. Also adds the broker's own self-service "change
-- agency" flow, mirroring change_salesperson_developer.

-- Too rigid for the real two-step onboarding flow: a broker legitimately
-- has neither brokerage_id nor license_path set between step 1 (details)
-- and step 2 (documents) -- enforced by application logic (admin won't
-- approve an independent broker without a license) instead.
alter table brokers drop constraint if exists brokers_independent_requires_license;

-- Old signature took a free-text brokerage name and get-or-created a
-- row by matching on lower(name) -- replaced entirely, so drop it
-- explicitly rather than leaving an orphaned overload.
drop function if exists claim_broker_profile(text, text, text, text, text, text, text);

create or replace function claim_broker_profile(
  p_full_name text,
  p_brn text,
  p_orn text,
  p_email text,
  p_mobile text,
  p_whatsapp text,
  p_brokerage_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
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

  if p_brokerage_id is not null and not exists (select 1 from brokerages where id = p_brokerage_id) then
    raise exception 'Selected agency not found.';
  end if;

  insert into brokers (brokerage_id, full_name, brn, orn, email, mobile, whatsapp)
  values (p_brokerage_id, p_full_name, p_brn, p_orn, p_email, p_mobile, p_whatsapp)
  returning id into v_broker_id;

  update profiles set broker_id = v_broker_id where id = auth.uid();

  insert into broker_agency_history (broker_id, brokerage_id, became_independent)
  values (v_broker_id, p_brokerage_id, p_brokerage_id is null);

  return v_broker_id;
end;
$$;

grant execute on function claim_broker_profile(text, text, text, text, text, text, uuid) to authenticated;

-- Self-service "change agency" -- Agency -> Another Agency, Agency ->
-- Independent (requires a license already on file), Independent ->
-- Agency. Subscription fields on the same brokers row are never touched.
create or replace function change_broker_agency(p_new_brokerage_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_broker_id uuid;
  v_license_path text;
begin
  select broker_id into v_broker_id from profiles where id = auth.uid();
  if v_broker_id is null then
    raise exception 'Not signed in as a broker.';
  end if;

  if p_new_brokerage_id is not null and not exists (select 1 from brokerages where id = p_new_brokerage_id) then
    raise exception 'That agency is not available to connect to.';
  end if;

  if p_new_brokerage_id is null then
    select license_path into v_license_path from brokers where id = v_broker_id;
    if v_license_path is null then
      raise exception 'Upload your broker license before becoming independent.';
    end if;
  end if;

  update broker_agency_history
  set ended_at = now()
  where broker_id = v_broker_id and ended_at is null;

  update brokers set brokerage_id = p_new_brokerage_id where id = v_broker_id;

  insert into broker_agency_history (broker_id, brokerage_id, became_independent)
  values (v_broker_id, p_new_brokerage_id, p_new_brokerage_id is null);
end;
$$;

grant execute on function change_broker_agency(uuid) to authenticated;

-- Backfill: seed an open history row for every broker currently linked to
-- an agency, same convention as the salesperson backfill in patch_62.
insert into broker_agency_history (broker_id, brokerage_id, started_at)
select id, brokerage_id, created_at from brokers
where brokerage_id is not null
and not exists (select 1 from broker_agency_history h where h.broker_id = brokers.id);

notify pgrst, 'reload schema';
