-- Run this after schema.sql + seed.sql.
-- Allows a newly signed-up developer to create their own org (always
-- starts 'pending' and unverified — only admins can promote it), and
-- blocks developers from ever self-approving via a normal UPDATE.

create policy "developers: authenticated can create own pending org"
  on developers for insert
  with check (
    auth.uid() is not null
    and status = 'pending'
    and verified = false
    and (select developer_id from profiles where id = auth.uid()) is null
  );

create policy "developers: owner can update own org"
  on developers for update
  using (id = (select developer_id from profiles where id = auth.uid()))
  with check (id = (select developer_id from profiles where id = auth.uid()));

create or replace function prevent_developer_self_approval() returns trigger as $$
begin
  if not is_admin() then
    if new.status is distinct from old.status or new.verified is distinct from old.verified then
      raise exception 'Only an admin can change developer status or verification.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger developers_no_self_approval
  before update on developers
  for each row execute procedure prevent_developer_self_approval();
