-- Lets a broker submit an interest enquiry on a developer's "Coming Soon"
-- pin (upcoming_projects, patch_80) -- a new channel, broker -> developer,
-- distinct from broker_project_enquiries (patch_127, which goes the other
-- way: buyer -> broker, about a broker's own listing). The developer
-- collects these on their existing /dashboard/upcoming-projects page.
create table if not exists upcoming_project_interests (
  id uuid primary key default gen_random_uuid(),
  upcoming_project_id uuid not null references upcoming_projects(id) on delete cascade,
  broker_id uuid not null references brokers(id) on delete cascade,
  created_by uuid references profiles(id),
  name text not null,
  email text,
  whatsapp text,
  message text,
  created_at timestamptz not null default now()
);
create index if not exists upcoming_project_interests_upcoming_project_id_idx on upcoming_project_interests(upcoming_project_id);
create index if not exists upcoming_project_interests_broker_id_idx on upcoming_project_interests(broker_id);

alter table upcoming_project_interests enable row level security;

-- Reuses the same is_verified_active_user() gate already enforced for
-- leads/bookings/broker_project_enquiries (patch_48/127) -- a real, live-
-- tested anti-spam/quality bar. broker_id must match the submitter's own
-- profile so a broker can only ever attribute interest to themselves.
create policy "upcoming_project_interests: broker submits own" on upcoming_project_interests for insert with check (
  created_by = auth.uid()
  and is_verified_active_user()
  and broker_id is not null
  and broker_id = (select broker_id from profiles where id = auth.uid())
);

create policy "upcoming_project_interests: broker reads own" on upcoming_project_interests for select using (
  broker_id = (select broker_id from profiles where id = auth.uid())
);

-- The developer who owns the upcoming_projects pin this interest was
-- submitted against -- joined through upcoming_project_id, matching the
-- ownership check already used on upcoming_projects itself.
create policy "upcoming_project_interests: developer reads own" on upcoming_project_interests for select using (
  exists (
    select 1 from upcoming_projects up
    where up.id = upcoming_project_interests.upcoming_project_id
    and up.developer_id = (select developer_id from profiles where id = auth.uid())
  )
);

create policy "upcoming_project_interests: admin reads all" on upcoming_project_interests for select using (is_admin());

notify pgrst, 'reload schema';
