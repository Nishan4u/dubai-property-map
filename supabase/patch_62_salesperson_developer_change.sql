-- Developer -> Salesperson management is narrowed to view/search/status/
-- disconnect only (Add/Invite Salesperson is removed from the developer
-- dashboard); a salesperson can now also change their own developer, or
-- have no developer connected at all after being disconnected, while
-- their own subscription stays completely untouched either way (it
-- already lives on the salespersons row itself, never on developer_id).

alter table salespersons alter column developer_id drop not null;

-- Developer can disconnect (set developer_id to null) a salesperson
-- currently on their own roster, but not reassign them to a different
-- developer -- that requires the salesperson's own action via
-- change_salesperson_developer() below.
create policy "salespersons: developer disconnects own roster" on salespersons for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id is null
);

-- Self-service "change developer" RPC -- ends the current history row (if
-- any), starts a fresh one, and repoints developer_id. Subscription
-- fields on this same row are never touched.
create or replace function change_salesperson_developer(p_new_developer_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salesperson_id uuid;
begin
  select salesperson_id into v_salesperson_id from profiles where id = auth.uid();
  if v_salesperson_id is null then
    raise exception 'Not signed in as a salesperson.';
  end if;

  if not exists (select 1 from developers where id = p_new_developer_id and status = 'active') then
    raise exception 'That developer is not available to connect to.';
  end if;

  update salesperson_developer_history
  set ended_at = now()
  where salesperson_id = v_salesperson_id and ended_at is null;

  update salespersons set developer_id = p_new_developer_id where id = v_salesperson_id;

  insert into salesperson_developer_history (salesperson_id, developer_id)
  values (v_salesperson_id, p_new_developer_id);
end;
$$;

grant execute on function change_salesperson_developer(uuid) to authenticated;

-- Backfill: give every currently-connected salesperson an open history
-- row so the ledger is complete going forward (a disconnect or change
-- from here on always has a "started_at" to close out).
insert into salesperson_developer_history (salesperson_id, developer_id, started_at)
select id, developer_id, created_at from salespersons
where developer_id is not null
and not exists (select 1 from salesperson_developer_history h where h.salesperson_id = salespersons.id);
