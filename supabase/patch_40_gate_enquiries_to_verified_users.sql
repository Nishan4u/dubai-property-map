-- "leads: anyone can submit" / "bookings: anyone can request" (schema.sql)
-- currently accept inserts from anyone, including fully anonymous visitors
-- with created_by left null — Book Appointment / Enquire Now must only be
-- usable by a logged-in, email-verified, active account (frontend already
-- gates this; this is the backend half, since RLS is what actually stops a
-- direct API call from bypassing it).

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

drop policy if exists "leads: anyone can submit" on leads;
create policy "leads: verified active users submit" on leads for insert with check (
  created_by = auth.uid() and is_verified_active_user()
);

drop policy if exists "bookings: anyone can request" on bookings;
create policy "bookings: verified active users request" on bookings for insert with check (
  created_by = auth.uid() and is_verified_active_user()
);
