-- Fixes "Only an admin can change developer status or verification." firing
-- on the ADMIN's own Approve/Suspend/Reinstate actions in /admin/developers.
--
-- Root cause: prevent_developer_self_approval() (patch_1/patch_2) only ever
-- allowed the update through when is_admin() was true, i.e. when auth.uid()
-- resolves to a profile with role = 'admin'. But the admin API route
-- (src/app/api/admin/developers/[id]/status/route.ts) already verifies the
-- caller is an admin using their own session, then performs the actual
-- UPDATE through the service-role client -- which has no associated user,
-- so auth.uid() is null and is_admin() correctly (but unhelpfully) returns
-- false inside the trigger, blocking every legitimate admin approval.
--
-- patch_37 already established the right fix for the exact same shape of
-- problem on profiles (prevent_profile_self_privilege_escalation): allow
-- the change when auth.role() = 'service_role', since only trusted server
-- code can ever hold that key -- a developer's own client-side call always
-- goes through their real session, where auth.uid() is set and the
-- self-approval check still applies. This just brings
-- prevent_developer_self_approval() in line with that established pattern.
create or replace function prevent_developer_self_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and auth.role() is distinct from 'service_role' then
    if new.status is distinct from old.status or new.verified is distinct from old.verified then
      raise exception 'Only an admin can change developer status or verification.';
    end if;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
