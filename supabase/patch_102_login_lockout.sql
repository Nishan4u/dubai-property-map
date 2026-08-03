-- Account Lockout & Failed-Login Tracking (rest of Module 27). Reuses
-- login_history (patch_101) for failed attempts too -- the `success`
-- column was added there for exactly this, rather than a separate table.
--
-- A failed attempt happens before authentication succeeds, so there's no
-- auth.uid() to scope the row to; user_id is left null and the row is
-- written by a new pre-auth API route using the service-role client
-- (bypasses RLS entirely -- there's no session to write as).
alter table login_history alter column user_id drop not null;

-- Lets the account owner still see their own failed attempts in their
-- Login History tab: a null user_id can't match the existing
-- "user_id = auth.uid()" policy, so this adds a second, email-based path
-- using the email claim already present on every session's JWT.
create policy "login_history: owner reads own by email" on login_history for select using (
  email = (auth.jwt() ->> 'email')
);

notify pgrst, 'reload schema';
