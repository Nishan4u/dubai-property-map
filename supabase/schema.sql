-- Dubai Property Map — core schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New Query).

create extension if not exists "pgcrypto";

-- ---------- Profiles (one per auth.users row) ----------
create type user_role as enum ('buyer', 'developer', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'buyer',
  developer_id uuid, -- set once the profile is linked to a developer org
  created_at timestamptz not null default now()
);

-- ---------- Developers ----------
create table developers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  initial text not null,
  color text not null default '#e3ab3d',
  verified boolean not null default false,
  founded int,
  description text,
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_developer_id_fkey
  foreign key (developer_id) references developers(id) on delete set null;

-- ---------- Communities ----------
create table communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  lng numeric,
  lat numeric,
  x_pct numeric,
  y_pct numeric,
  pin_color text not null default '#3b82f6',
  created_at timestamptz not null default now()
);

-- ---------- Projects ----------
create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  developer_id uuid not null references developers(id) on delete cascade,
  community_id uuid not null references communities(id) on delete restrict,
  property_type text not null default 'Apartments',
  listing_type text not null default 'off-plan' check (listing_type in ('buy','rent','off-plan','ready')),
  status text not null default 'draft' check (status in ('draft','published','expired','featured','rejected','archived')),
  approval_status text not null default 'pending' check (approval_status in ('pending','review','approved','rejected')),
  featured boolean not null default false,
  price_from_aed numeric not null default 0,
  payment_plan text,
  bedrooms_from int not null default 0,
  bedrooms_to int not null default 0,
  unit_types text[] not null default '{}',
  handover_quarter text,
  handover_year int,
  rating numeric not null default 0,
  reviews int not null default 0,
  gradient text not null default 'from-amber-500/40 via-slate-800 to-slate-950',
  tags text[] not null default '{}',
  description text,
  amenities text[] not null default '{}',
  views int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_developer_id_idx on projects(developer_id);
create index projects_community_id_idx on projects(community_id);
create index projects_status_idx on projects(status);

-- ---------- Leads ----------
create table leads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  country text,
  budget_aed numeric,
  status text not null default 'new' check (status in ('new','contacted','qualified','won','lost')),
  source text not null default 'Website',
  assigned_agent text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index leads_project_id_idx on leads(project_id);

-- ---------- Bookings ----------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  client_name text not null,
  client_email text,
  client_phone text,
  scheduled_date date not null,
  scheduled_time text,
  agent text,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index bookings_project_id_idx on bookings(project_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table developers enable row level security;
alter table communities enable row level security;
alter table projects enable row level security;
alter table leads enable row level security;
alter table bookings enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- profiles
create policy "profiles: read own" on profiles for select using (id = auth.uid());
create policy "profiles: admins read all" on profiles for select using (is_admin());
create policy "profiles: update own" on profiles for update using (id = auth.uid());
create policy "profiles: insert own on signup" on profiles for insert with check (id = auth.uid());

-- developers
create policy "developers: public read active" on developers for select using (status = 'active' or is_admin());
create policy "developers: owner reads own" on developers for select using (
  id = (select developer_id from profiles where id = auth.uid())
);
create policy "developers: admin manages" on developers for all using (is_admin()) with check (is_admin());

-- communities (public reference data)
create policy "communities: public read" on communities for select using (true);
create policy "communities: admin manages" on communities for all using (is_admin()) with check (is_admin());

-- projects
create policy "projects: public read published" on projects for select using (
  status in ('published','featured') or is_admin()
  or developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "projects: developer manages own" on projects for all using (
  developer_id = (select developer_id from profiles where id = auth.uid())
) with check (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "projects: admin manages all" on projects for all using (is_admin()) with check (is_admin());

-- leads
create policy "leads: anyone can submit" on leads for insert with check (true);
create policy "leads: developer reads own project leads" on leads for select using (
  project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid()))
);
create policy "leads: admin reads all" on leads for select using (is_admin());
create policy "leads: developer updates own project leads" on leads for update using (
  project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid()))
);

-- bookings
create policy "bookings: anyone can request" on bookings for insert with check (true);
create policy "bookings: developer reads own project bookings" on bookings for select using (
  project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid()))
);
create policy "bookings: admin reads all" on bookings for select using (is_admin());
create policy "bookings: developer updates own project bookings" on bookings for update using (
  project_id in (select id from projects where developer_id = (select developer_id from profiles where id = auth.uid()))
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
