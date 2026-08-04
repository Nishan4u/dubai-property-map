-- Web Push Notifications (last piece of Module 20/28): real browser
-- push, not a fabricated integration -- VAPID keys are self-generated
-- (no third-party vendor account needed, unlike SMS/ERP/Ads/Storage).
--
-- One user can have multiple subscribed devices/browsers, hence a
-- dedicated table keyed by endpoint rather than a column on profiles.
--
-- Every statement is safely re-runnable, per the patch_104 lesson.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions: user manages own" on push_subscriptions;
create policy "push_subscriptions: user manages own" on push_subscriptions for all using (
  user_id = auth.uid()
) with check (
  user_id = auth.uid()
);

drop policy if exists "push_subscriptions: admin reads all" on push_subscriptions;
create policy "push_subscriptions: admin reads all" on push_subscriptions for select using (is_admin());

notify pgrst, 'reload schema';
