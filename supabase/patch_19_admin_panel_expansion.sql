-- Big batch: community SEO/boundary fields, managed Property Types &
-- Amenities lists, real nav-link (Menus) management, redirects, and a real
-- audit log for admin actions.

alter table communities
  add column meta_title text,
  add column meta_description text,
  add column boundary_radius_km numeric;

create table property_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table property_types enable row level security;
create policy "property_types: public read" on property_types for select using (true);
create policy "property_types: admin manages" on property_types for all using (is_admin()) with check (is_admin());

insert into property_types (name, sort_order) values
  ('Apartments', 1), ('Villas', 2), ('Townhouses', 3), ('Penthouse', 4);

create table amenities (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table amenities enable row level security;
create policy "amenities: public read" on amenities for select using (true);
create policy "amenities: admin manages" on amenities for all using (is_admin()) with check (is_admin());

insert into amenities (name, sort_order) values
  ('Pool', 1), ('Gym', 2), ('Kids Area', 3), ('Cinema', 4), ('Sky Lounge', 5),
  ('Beach', 6), ('Golf', 7), ('Smart Home', 8), ('Parking', 9), ('Pet Friendly', 10);

create table nav_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  location text not null check (location in ('header', 'footer')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table nav_links enable row level security;
create policy "nav_links: public read" on nav_links for select using (true);
create policy "nav_links: admin manages" on nav_links for all using (is_admin()) with check (is_admin());

insert into nav_links (label, url, location, sort_order) values
  ('Developers', '/developers', 'header', 1),
  ('Communities', '/communities', 'header', 2),
  ('New Launches', '/?tag=new-launch', 'header', 3),
  ('Blog', '/blog', 'header', 4),
  ('Advertise', '/advertise', 'header', 5),
  ('About', '/about', 'footer', 1),
  ('Contact', '/contact', 'footer', 2),
  ('FAQ', '/faq', 'footer', 3);

create table redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text unique not null,
  to_path text not null,
  permanent boolean not null default true,
  created_at timestamptz not null default now()
);

alter table redirects enable row level security;
create policy "redirects: public read" on redirects for select using (true);
create policy "redirects: admin manages" on redirects for all using (is_admin()) with check (is_admin());

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;
create policy "audit_log: admin reads" on audit_log for select using (is_admin());
create policy "audit_log: admin inserts" on audit_log for insert with check (is_admin());

insert into site_content (slug, title, body) values
  ('privacy', 'Privacy Policy', 'This platform respects your privacy. We collect only the information needed to connect you with developers and process viewing requests — name, email, and phone number when you submit an enquiry. We do not sell your data to third parties.'),
  ('terms', 'Terms of Service', 'By using Dubai Property Map you agree to use the platform for genuine property enquiries. Listings are provided by third-party developers; we do not guarantee pricing or availability, which developers may change at any time.'),
  ('careers', 'Careers', 'We are not currently hiring, but check back soon or reach out via the Contact page if you would like to introduce yourself.'),
  ('homepage_hero', 'Find Your Property in Dubai', 'Explore off-plan and ready properties across Dubai''s top communities.')
on conflict (slug) do nothing;
