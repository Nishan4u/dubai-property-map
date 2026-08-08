-- Broker Directory & Property Listing Module.
-- Additive only -- no existing table/column/policy/function is narrowed or
-- removed. claim_broker_profile() is replaced with the EXACT signature it
-- has today (patch_66: p_full_name, p_brn, p_orn, p_email, p_mobile,
-- p_whatsapp, p_brokerage_id -> uuid), so every existing caller keeps
-- working unchanged -- the only behavior added is slug generation.

-- ============================================================
-- 1. Brokers: public-profile fields
-- ============================================================
alter table brokers add column if not exists slug text;
alter table brokers add column if not exists bio text;
alter table brokers add column if not exists experience_years int;
alter table brokers add column if not exists languages text[] not null default '{}';
alter table brokers add column if not exists verification_status text not null default 'none'
  check (verification_status in ('none', 'pending_payment', 'active', 'rejected', 'revoked', 'expired'));
alter table brokers add column if not exists verification_expires_at date;
alter table brokers add column if not exists featured boolean not null default false;
alter table brokers add column if not exists profile_views int not null default 0;

-- Deterministic, collision-free (broker_id is already unique) -- no retry
-- loop needed, unlike a purely name-derived slug.
create or replace function generate_broker_slug(p_full_name text, p_broker_id uuid) returns text
language sql stable
as $$
  select trim(both '-' from lower(regexp_replace(coalesce(p_full_name, 'broker'), '[^a-zA-Z0-9]+', '-', 'g')))
    || '-' || substr(p_broker_id::text, 1, 6);
$$;

update brokers set slug = generate_broker_slug(full_name, id) where slug is null;
alter table brokers alter column slug set not null;
create unique index if not exists brokers_slug_uidx on brokers(slug);

-- Admin-only / server-only: a broker updating "own profile fields" (the
-- existing patch_30 policy) must never self-verify, self-feature, or
-- rewrite their own view counter -- mirrors the existing revoke below it
-- for account_status/subscription_status etc.
revoke update (verification_status, verification_expires_at, featured, profile_views) on brokers from authenticated;

create or replace function increment_broker_profile_views(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update brokers set profile_views = profile_views + 1 where id = p_id;
$$;

grant execute on function increment_broker_profile_views(uuid) to anon, authenticated;

-- Re-created with the CURRENT live signature (patch_66) -- every existing
-- call site (broker registration flow) keeps working unchanged. The only
-- addition is generating a slug for the new broker row.
create or replace function claim_broker_profile(
  p_full_name text,
  p_brn text,
  p_orn text,
  p_email text,
  p_mobile text,
  p_whatsapp text,
  p_brokerage_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_broker_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  if (select role from profiles where id = auth.uid()) <> 'broker' then
    raise exception 'Only a broker-role account can register a brokerage.';
  end if;

  if (select broker_id from profiles where id = auth.uid()) is not null then
    raise exception 'This account is already linked to a broker profile.';
  end if;

  if p_brokerage_id is not null and not exists (select 1 from brokerages where id = p_brokerage_id) then
    raise exception 'Selected agency not found.';
  end if;

  insert into brokers (brokerage_id, full_name, brn, orn, email, mobile, whatsapp)
  values (p_brokerage_id, p_full_name, p_brn, p_orn, p_email, p_mobile, p_whatsapp)
  returning id into v_broker_id;

  update brokers set slug = generate_broker_slug(p_full_name, v_broker_id) where id = v_broker_id;

  update profiles set broker_id = v_broker_id where id = auth.uid();

  insert into broker_agency_history (broker_id, brokerage_id, became_independent)
  values (v_broker_id, p_brokerage_id, p_brokerage_id is null);

  return v_broker_id;
end;
$$;

grant execute on function claim_broker_profile(text, text, text, text, text, text, uuid) to authenticated;

-- Public-safe projection of a broker's profile -- deliberately excludes
-- email/mobile/whatsapp/orn/rera_card_path/stripe fields/etc, exactly like
-- projects_public_meta (patch_82) excludes payment plan/escrow/contact
-- info. Contact fields are only ever served to a confirmed registered
-- viewer via a dedicated server route (see /api/brokers/[slug]/contact),
-- never embedded in this view or sent to a guest's page payload at all.
create or replace view brokers_public_profile as
select
  b.id,
  b.slug,
  b.full_name,
  b.photo_url,
  b.bio,
  b.experience_years,
  b.languages,
  b.brn,
  b.verification_status,
  b.verification_expires_at,
  b.featured,
  b.profile_views,
  b.created_at,
  b.brokerage_id,
  bk.name as brokerage_name,
  bk.verified as brokerage_verified
from brokers b
left join brokerages bk on bk.id = b.brokerage_id
where b.account_status = 'approved';

grant select on brokers_public_profile to anon, authenticated;

-- ============================================================
-- 2. Broker Property Listings (Sale / Rent / Lease)
-- ============================================================
create table if not exists broker_listings (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references brokers(id) on delete cascade,
  slug text not null unique,
  title text not null,
  property_type text not null,
  listing_type text not null check (listing_type in ('sale', 'rent', 'lease')),
  price_aed numeric not null,
  community_id uuid references communities(id) on delete set null,
  location_text text,
  lat numeric,
  lng numeric,
  bedrooms int,
  bathrooms int,
  size_sqft numeric,
  description text,
  amenities text[] not null default '{}',
  -- Marketing-facing status (spec's "Property Status"), separate from
  -- moderation below.
  availability_status text not null default 'available'
    check (availability_status in ('available', 'under_offer', 'sold', 'rented')),
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected', 'archived')),
  rejection_reason text,
  whatsapp text,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists broker_listings_broker_id_idx on broker_listings(broker_id);
create index if not exists broker_listings_community_id_idx on broker_listings(community_id);
create index if not exists broker_listings_moderation_status_idx on broker_listings(moderation_status);

alter table broker_listings enable row level security;
create policy "broker_listings: broker manages own" on broker_listings for all using (
  broker_id = (select broker_id from profiles where id = auth.uid())
) with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "broker_listings: public reads approved" on broker_listings for select using (
  moderation_status = 'approved'
);
create policy "broker_listings: admin manages all" on broker_listings for all using (is_admin()) with check (is_admin());

-- Admin-only moderation fields -- a broker managing "own" rows above must
-- never self-approve/reject their own listing.
revoke update (moderation_status, rejection_reason) on broker_listings from authenticated;

create or replace function increment_broker_listing_views(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update broker_listings set views = views + 1 where id = p_id;
$$;

grant execute on function increment_broker_listing_views(uuid) to anon, authenticated;

-- ============================================================
-- 3. Developer Projects listed under a Broker's public profile
-- ============================================================
create table if not exists broker_project_links (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references brokers(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (broker_id, project_id)
);
create index if not exists broker_project_links_broker_id_idx on broker_project_links(broker_id);
create index if not exists broker_project_links_project_id_idx on broker_project_links(project_id);

alter table broker_project_links enable row level security;
-- A broker may only link a project that's actually publicly visible
-- (projects_public_meta is the same curated, published/authorized-only
-- view used everywhere else on the public site) -- never a draft/pending
-- project belonging to someone else.
create policy "broker_project_links: broker manages own" on broker_project_links for all using (
  broker_id = (select broker_id from profiles where id = auth.uid())
) with check (
  broker_id = (select broker_id from profiles where id = auth.uid())
  and exists (select 1 from projects_public_meta pm where pm.id = project_id)
);
create policy "broker_project_links: public read" on broker_project_links for select using (true);
create policy "broker_project_links: admin manages all" on broker_project_links for all using (is_admin()) with check (is_admin());

-- Enquiries submitted against a Developer Project via a Broker's profile
-- -- a completely separate channel from the existing developer-facing
-- leads/property_requests/ProjectEnquiryPanel flow, which is entirely
-- untouched. These go to the Broker, never the Developer.
create table if not exists broker_project_enquiries (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references brokers(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_by uuid references profiles(id),
  name text not null,
  email text,
  phone text,
  message text,
  created_at timestamptz not null default now()
);
create index if not exists broker_project_enquiries_broker_id_idx on broker_project_enquiries(broker_id);

alter table broker_project_enquiries enable row level security;
-- Reuses the exact same is_verified_active_user() gate already enforced
-- for leads/bookings (patch_48) -- a real, live-tested anti-spam/quality
-- bar, not a new one invented for this table.
create policy "broker_project_enquiries: verified active users submit" on broker_project_enquiries for insert with check (
  created_by = auth.uid() and is_verified_active_user()
);
create policy "broker_project_enquiries: broker reads own" on broker_project_enquiries for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);
create policy "broker_project_enquiries: admin reads all" on broker_project_enquiries for select using (is_admin());

-- ============================================================
-- 4. Verified Broker annual fee -- reuses the existing generic
--    platform_settings key/value table + its already-built admin editor
--    (/admin/settings -> SettingsTable.tsx), so "Change the annual
--    verification fee" needs no new admin UI at all.
-- ============================================================
insert into platform_settings (key, label, value)
values ('broker_verification_fee_aed', 'Broker Verification Fee (AED/year)', '50')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
