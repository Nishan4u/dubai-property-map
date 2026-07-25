-- Real notifications system: lets admins/developers create in-app
-- notifications for other users (project approvals, booking updates,
-- new leads/messages, developer status changes, admin broadcasts).
-- The existing "insert own" policy only allowed self-notifications
-- (e.g. "your enquiry was received"); this adds a permissive policy so
-- any signed-in actor can notify another real, signed-in user.

create policy "notifications: any authenticated user can create"
  on notifications for insert
  with check (auth.uid() is not null);
