-- Found during QA: Admin -> Users -> "Suspend" only ever affected the
-- /account page's own display (profiles.suspended was never read anywhere
-- else) — a suspended buyer/admin could still submit leads/bookings same as
-- an active one. is_verified_active_user() now also requires the profile
-- not be suspended, closing that gap for every role it gates.
create or replace function is_verified_active_user() returns boolean as $$
  select exists (
    select 1
    from auth.users u
    join profiles p on p.id = u.id
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and not p.suspended
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
