-- Fixes "Database error saving new user" on signup.
-- Root cause: the trigger function referenced `profiles` unqualified,
-- which can fail to resolve when fired from the `auth` schema's insert
-- trigger context. Re-create it fully schema-qualified with an explicit
-- search_path.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer')
  );
  return new;
end;
$$;

-- Same hardening for the other two security-definer functions.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function prevent_developer_self_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.status is distinct from old.status or new.verified is distinct from old.verified then
      raise exception 'Only an admin can change developer status or verification.';
    end if;
  end if;
  return new;
end;
$$;
