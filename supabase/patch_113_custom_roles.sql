-- Custom Roles / Permissions (Module 2): a new, opt-in "limited admin"
-- tier layered on top of the existing role = 'admin' accounts. This is
-- deliberately NOT a rewrite of the fixed-role system (buyer/developer/
-- admin/broker/salesperson/staff/broker_agency) -- that enum, and every
-- RLS policy built on it this session, stays completely untouched.
--
-- Existing admin accounts (custom_role_id left null) keep their exact
-- current full-access behavior -- is_admin() still just checks
-- `role = 'admin'`, unchanged. A NEW admin account can optionally be
-- created with custom_role_id set, making it a "restricted admin" whose
-- access is narrowed by src/lib/permissions.ts at the application layer
-- (nav visibility + representative server-side route checks) -- NOT by
-- rewriting RLS, which would mean touching every one of the ~54
-- is_admin()-gated policy files. See docs/MASTER_PLAN.md's Module 2
-- writeup for the honest statement of that limitation.
--
-- Every statement is safely re-runnable, per the patch_104 lesson.

create table if not exists custom_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  permissions jsonb not null default '{}', -- { "<module_key>": "view" | "manage" }
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table custom_roles enable row level security;

drop policy if exists "custom_roles: admin manages all" on custom_roles;
create policy "custom_roles: admin manages all" on custom_roles for all using (is_admin()) with check (is_admin());

alter table profiles add column if not exists custom_role_id uuid references custom_roles(id) on delete set null;

notify pgrst, 'reload schema';
