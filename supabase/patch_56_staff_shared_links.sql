-- Trackable share links (Section 8). Reuses the same referral_code / staff
-- attribution mechanism already built for checkout (patch_55) — a share
-- link just carries the staff's referral code via a redirect + cookie, so
-- a visitor who registers and later subscribes gets attributed the same
-- way as someone who typed the code in manually. Clicking alone never
-- generates commission — only recordCommission() on an actual paid
-- subscription does.
create table staff_shared_links (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  target_type text not null check (target_type in ('project', 'developer')),
  target_id uuid not null,
  share_code text not null unique,
  created_at timestamptz not null default now(),
  unique (staff_id, target_type, target_id)
);
create index staff_shared_links_staff_id_idx on staff_shared_links(staff_id);

alter table staff_shared_links enable row level security;
create policy "staff_shared_links: self manages own" on staff_shared_links for all using (
  staff_id = (select staff_id from profiles where id = auth.uid())
) with check (
  staff_id = (select staff_id from profiles where id = auth.uid())
);
create policy "staff_shared_links: admin reads all" on staff_shared_links for select using (is_admin());

create table staff_link_clicks (
  id uuid primary key default gen_random_uuid(),
  shared_link_id uuid not null references staff_shared_links(id) on delete cascade,
  clicked_at timestamptz not null default now()
);
create index staff_link_clicks_link_id_idx on staff_link_clicks(shared_link_id);

alter table staff_link_clicks enable row level security;
create policy "staff_link_clicks: self reads own" on staff_link_clicks for select using (
  shared_link_id in (select id from staff_shared_links where staff_id = (select staff_id from profiles where id = auth.uid()))
);
create policy "staff_link_clicks: admin reads all" on staff_link_clicks for select using (is_admin());

revoke update, insert, delete on staff_link_clicks from authenticated;
