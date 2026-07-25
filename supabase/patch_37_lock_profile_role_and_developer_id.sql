-- profiles.role and profiles.developer_id are identity-defining columns,
-- but "profiles: update own" (schema.sql) has no WITH CHECK, so Postgres
-- reuses the USING clause (id = auth.uid()) as the check — meaning any
-- signed-in user can currently run
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', myOwnId)
-- and self-promote, or point their own developer_id at any EXISTING
-- developer (hijacking that company's dashboard), since the policy only
-- ever restricted *which row*, never *which columns*.
--
-- A blanket `revoke update (role) on profiles from authenticated` (the
-- pattern used for brokers.account_status etc in patch_30) is not an
-- option here: AdminUsersTable.tsx changes another user's role with a
-- plain client-side `supabase.from("profiles").update({ role })`, which
-- depends on the "profiles: admins update all" policy (patch_22) and
-- would break under a revoke. Same story for developer_id: revoking it
-- would break DeveloperOnboarding.tsx's legitimate self-service linking
-- (insert a fresh 'pending' developer, then point your own profile at it).
--
-- So instead, mirror prevent_developer_self_approval() (patch_1): a
-- BEFORE UPDATE trigger that allows the change only for admins, for
-- service-role server routes, or for the one legitimate self-service shape.

create or replace function prevent_profile_self_privilege_escalation() returns trigger as $$
begin
  if is_admin() or auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only an admin can change a profile role.';
  end if;

  if new.developer_id is distinct from old.developer_id then
    -- Self-service developer onboarding (DeveloperOnboarding.tsx): only
    -- allowed from unlinked -> a brand-new, still-pending, still-unclaimed
    -- developer org. Never lets you jump to an existing/active company, and
    -- never lets you change an already-linked developer_id.
    if old.developer_id is not null then
      raise exception 'Only an admin can change an already-linked developer_id.';
    end if;

    if not exists (
      select 1 from developers
      where id = new.developer_id
        and status = 'pending'
        and verified = false
    ) then
      raise exception 'You can only self-link to a new, unapproved developer org.';
    end if;

    if exists (
      select 1 from profiles
      where developer_id = new.developer_id
        and id <> new.id
    ) then
      raise exception 'This developer org is already linked to another account.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger profiles_no_self_privilege_escalation
  before update on profiles
  for each row execute procedure prevent_profile_self_privilege_escalation();
