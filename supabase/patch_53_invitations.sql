-- Unified invitation system backing 4 flows that previously either never
-- sent an email at all (developer team-member invite: a bare DB insert with
-- no send step; developer add-salesperson: immediate Auth account creation
-- with email_confirm:true, which explicitly suppresses any email and shows
-- the password in the UI instead) or didn't exist yet as a working feature
-- (admin invite-member; admin add-salesperson, whose only existing route
-- explicitly blocked admins with a 403). One table + one accept flow covers
-- all four so behavior/status vocabulary stays consistent.

create table invitations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('team_member', 'developer_salesperson', 'admin_member', 'admin_salesperson')),
  email text not null,
  developer_id uuid references developers(id) on delete cascade,
  role text,
  payload jsonb not null default '{}',
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check (status in ('pending', 'sent', 'accepted', 'expired', 'failed', 'cancelled')),
  invited_by uuid not null references profiles(id),
  last_error text,
  sent_at timestamptz,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  constraint invitations_developer_kind_match check (
    (kind in ('team_member', 'developer_salesperson') and developer_id is not null)
    or (kind in ('admin_member', 'admin_salesperson'))
  )
);
create index invitations_email_idx on invitations(email);
create index invitations_developer_id_idx on invitations(developer_id);
create index invitations_status_idx on invitations(status);

alter table invitations enable row level security;

-- No client-side select/insert policies at all: every read/write to this
-- table goes through server routes using the service-role client, since the
-- accept page must work for a not-yet-authenticated invitee looking up
-- their own token, which a per-user RLS policy can't express safely.
-- Admin can still browse it read-only for visibility via a dedicated query.
create policy "invitations: admin reads all" on invitations for select using (is_admin());

-- team_members: widen status vocabulary to match the invitation lifecycle
-- and add the token bookkeeping needed for resend/expiry, without touching
-- any existing 'invited'/'active'/'removed' rows.
alter table team_members add column if not exists invitation_id uuid references invitations(id) on delete set null;
alter table team_members drop constraint if exists team_members_status_check;
alter table team_members add constraint team_members_status_check
  check (status in ('invited', 'active', 'removed', 'expired', 'failed', 'cancelled'));

-- salespersons: support a row existing before the invitee has accepted
-- (so admin/developer can see + resend/cancel it in their roster list)
-- without yet having a linked Supabase Auth account.
alter table salespersons add column if not exists invitation_id uuid references invitations(id) on delete set null;
alter table salespersons alter column email drop not null;
do $$
declare
  r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'salespersons'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
      and pg_get_constraintdef(oid) not ilike '%subscription_status%'
  loop
    execute format('alter table salespersons drop constraint %I', r.conname);
  end loop;
end $$;
alter table salespersons add constraint salespersons_status_check
  check (status in ('active', 'inactive', 'pending_invitation'));
