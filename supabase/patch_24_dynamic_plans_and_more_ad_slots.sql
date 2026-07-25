-- Real, admin-editable subscription plans. The admin "Packages & Plans"
-- page previously showed hardcoded plans with fabricated subscriber counts
-- (62/48/34/12) and dead "+ New Plan"/"Edit" buttons. This replaces the
-- hardcoded plan array in PlanCards.tsx with a real table admins can manage,
-- including the Stripe Price ID per plan (so activating Stripe later just
-- means pasting IDs into this admin UI, not editing .env.local).

create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  price_label text not null,
  features text[] not null default '{}',
  stripe_price_id text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table subscription_plans enable row level security;
create policy "subscription_plans: public read" on subscription_plans for select using (true);
create policy "subscription_plans: admin manages" on subscription_plans for all using (is_admin()) with check (is_admin());

insert into subscription_plans (key, name, price_label, features, sort_order) values
  ('free', 'Free', 'AED 0', ARRAY['3 active listings','Basic analytics','Email support'], 0),
  ('starter', 'Starter', 'AED 999/mo', ARRAY['15 active listings','Lead management','Priority support'], 1),
  ('professional', 'Professional', 'AED 2,999/mo', ARRAY['Unlimited listings','Advanced analytics','Featured pins (2)','CRM integration'], 2),
  ('enterprise', 'Enterprise', 'Custom', ARRAY['Unlimited everything','Dedicated account manager','API access','Homepage banner'], 3);

-- developers.plan_tier now references subscription_plans instead of a fixed
-- check-constraint list, so admins can add/rename plans without a schema
-- migration each time.
alter table developers drop constraint if exists developers_plan_tier_check;
alter table developers add constraint developers_plan_tier_fkey
  foreign key (plan_tier) references subscription_plans(key);

-- Two more real ad placement locations: a banner on individual project pages
-- and one on the developer's own public profile page (in addition to the
-- existing homepage banner/sidebar banner/sponsored pin/community banner).
alter table ad_placements drop constraint ad_placements_placement_type_check;
alter table ad_placements add constraint ad_placements_placement_type_check
  check (placement_type in ('homepage_banner','sidebar_banner','sponsored_pin','community_banner','project_page_banner','developer_page_banner'));
