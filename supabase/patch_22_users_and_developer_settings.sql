-- Real Admin "Platform Users" page: lets admins list every real user
-- (email comes from auth.users, joined via a security-definer RPC since
-- client-side queries can't read auth.users directly), change roles, and
-- suspend/reinstate individual accounts.

alter table profiles add column if not exists suspended boolean not null default false;

create policy "profiles: admins update all" on profiles for update using (is_admin()) with check (is_admin());

create or replace function admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  developer_id uuid,
  developer_name text,
  suspended boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select p.id, u.email, p.full_name, p.role::text, p.developer_id, d.name, p.suspended, p.created_at
  from profiles p
  join auth.users u on u.id = p.id
  left join developers d on d.id = p.developer_id
  where is_admin()
  order by p.created_at desc;
$$;

grant execute on function admin_list_users() to authenticated;

-- Real Developer Settings: notification preferences (which already-wired
-- in-app events they want notified about) and an optional lead webhook
-- URL (their own CRM/Zapier/Make endpoint) that gets a live POST when a
-- new lead/enquiry comes in for one of their projects.

alter table developers add column if not exists notification_prefs jsonb not null default '{"new_leads": true, "new_messages": true}'::jsonb;
alter table developers add column if not exists lead_webhook_url text;
