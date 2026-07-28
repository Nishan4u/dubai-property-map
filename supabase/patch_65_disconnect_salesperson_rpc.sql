-- The raw client-side UPDATE approach for developer-initiated disconnect
-- hit an unresolved RLS interaction (confirmed live: a WITH CHECK that
-- should evaluate to true via the "developer_id IS NULL" branch was still
-- rejected) and, separately, never closed out the open
-- salesperson_developer_history row. Replacing with the same
-- security-definer RPC pattern already used for the salesperson's own
-- change_salesperson_developer -- bypasses the RLS puzzle entirely and
-- atomically closes history in the same transaction.

-- Revert to patch_30's original, narrower policy: a developer can keep
-- editing a roster row's own fields, but a raw client update can no
-- longer null out developer_id directly -- that only happens through the
-- RPC below, which also closes the history record atomically.
drop policy if exists "salespersons: developer updates own roster" on salespersons;
create policy "salespersons: developer updates own roster" on salespersons for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);

create or replace function disconnect_salesperson_from_developer(p_salesperson_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_developer_id uuid;
begin
  select developer_id into v_developer_id from profiles where id = auth.uid();
  if v_developer_id is null then
    raise exception 'Not signed in as a developer.';
  end if;

  update salespersons
  set developer_id = null
  where id = p_salesperson_id and developer_id = v_developer_id;

  if not found then
    raise exception 'Salesperson not found on your roster.';
  end if;

  update salesperson_developer_history
  set ended_at = now()
  where salesperson_id = p_salesperson_id and developer_id = v_developer_id and ended_at is null;
end;
$$;

grant execute on function disconnect_salesperson_from_developer(uuid) to authenticated;
