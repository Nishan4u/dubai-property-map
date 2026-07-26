-- SECURITY FIX: live testing found that unauthenticated requests can still
-- insert into leads/bookings directly via the REST API — the restrictive
-- policies from patch_40 are not currently in effect on production (root
-- cause unconfirmed; this re-applies them idempotently to guarantee the
-- correct state regardless of how they were lost).
create or replace function is_verified_active_user() returns boolean as $$
  select exists (
    select 1
    from auth.users u
    join profiles p on p.id = u.id
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and (
        p.role in ('buyer', 'admin')
        or (p.role = 'developer' and exists (
          select 1 from developers d where d.id = p.developer_id and d.status = 'active'
        ))
        or (p.role = 'broker' and exists (
          select 1 from brokers b where b.id = p.broker_id and b.account_status = 'approved'
        ))
        or (p.role = 'salesperson' and exists (
          select 1 from salespersons s where s.id = p.salesperson_id and s.status = 'active'
        ))
      )
  );
$$ language sql stable security definer;

-- Drop every possible variant of the old permissive policy by name, then
-- every policy currently on these tables' INSERT command, to guarantee no
-- stray permissive policy survives alongside the restrictive one (Postgres
-- RLS policies are OR'd together, so a leftover permissive policy would
-- silently defeat this fix).
drop policy if exists "leads: anyone can submit" on leads;
drop policy if exists "leads: verified active users submit" on leads;
create policy "leads: verified active users submit" on leads for insert with check (
  created_by = auth.uid() and is_verified_active_user()
);

drop policy if exists "bookings: anyone can request" on bookings;
drop policy if exists "bookings: verified active users request" on bookings;
create policy "bookings: verified active users request" on bookings for insert with check (
  created_by = auth.uid() and is_verified_active_user()
);

-- Confirm RLS itself is enabled (a disabled RLS table ignores all policies).
alter table leads enable row level security;
alter table bookings enable row level security;
