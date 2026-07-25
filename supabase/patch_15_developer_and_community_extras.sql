-- Developer page: real Awards, Reviews, and a Contact form that actually
-- goes somewhere. Plus letting buyers favorite whole communities, not just
-- individual projects.

alter table developers
  add column email text,
  add column phone text,
  add column website text;

create table developer_awards (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references developers(id) on delete cascade,
  title text not null,
  year int,
  issuer text,
  created_at timestamptz not null default now()
);

alter table developer_awards enable row level security;
create policy "developer_awards: public read" on developer_awards for select using (true);
create policy "developer_awards: owner manages" on developer_awards for all
  using (developer_id = (select developer_id from profiles where id = auth.uid()))
  with check (developer_id = (select developer_id from profiles where id = auth.uid()));
create policy "developer_awards: admin manages" on developer_awards for all using (is_admin()) with check (is_admin());

create table developer_reviews (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references developers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (developer_id, user_id)
);

alter table developer_reviews enable row level security;
create policy "developer_reviews: public read" on developer_reviews for select using (true);
create policy "developer_reviews: insert own" on developer_reviews for insert with check (user_id = auth.uid());
create policy "developer_reviews: update own" on developer_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "developer_reviews: delete own" on developer_reviews for delete using (user_id = auth.uid());

create table developer_messages (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references developers(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table developer_messages enable row level security;
create policy "developer_messages: anyone can send" on developer_messages for insert with check (true);
create policy "developer_messages: owner reads own" on developer_messages for select using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "developer_messages: owner updates own" on developer_messages for update using (
  developer_id = (select developer_id from profiles where id = auth.uid())
);
create policy "developer_messages: admin reads all" on developer_messages for select using (is_admin());

create table favorite_communities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, community_id)
);

alter table favorite_communities enable row level security;
create policy "favorite_communities: read own" on favorite_communities for select using (user_id = auth.uid());
create policy "favorite_communities: insert own" on favorite_communities for insert with check (user_id = auth.uid());
create policy "favorite_communities: delete own" on favorite_communities for delete using (user_id = auth.uid());
