-- Broker Agency: self-service "Disconnect" action on its own broker roster.
-- Mirrors disconnect_salesperson_from_developer (patch_65) -- a security
-- definer RPC instead of a raw RLS UPDATE, since raw UPDATE policies proved
-- unreliable earlier this session for the equivalent salesperson/developer
-- relationship. Disconnecting a broker makes them independent (their
-- account, subscription and request history stay intact), matching what
-- change_broker_agency(null) does for a broker who self-service leaves.

create or replace function disconnect_broker_from_agency(p_broker_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_agency_id uuid;
begin
  select broker_agency_id into v_agency_id from profiles where id = auth.uid();
  if v_agency_id is null then
    raise exception 'Not signed in as a broker agency.';
  end if;

  update brokers set brokerage_id = null
  where id = p_broker_id and brokerage_id = v_agency_id;

  if not found then
    raise exception 'Broker not found on your roster.';
  end if;

  update broker_agency_history set ended_at = now()
  where broker_id = p_broker_id and brokerage_id = v_agency_id and ended_at is null;

  insert into broker_agency_history (broker_id, brokerage_id, became_independent)
  values (p_broker_id, null, true);
end;
$$;

grant execute on function disconnect_broker_from_agency(uuid) to authenticated;

notify pgrst, 'reload schema';
