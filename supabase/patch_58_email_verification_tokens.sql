-- Custom signup-confirmation email system. Supabase Auth's own built-in
-- confirmation email depends on Supabase's outbound SMTP relay, which was
-- found to be blocked/broken at the platform level (verified: correct
-- SMTP credentials, correct sender domain, full message send all succeed
-- when tested directly against Resend's relay from outside Supabase's
-- network -- Supabase's own Auth service still fails identically after a
-- full project restart and trying both port 465 and 587, pointing to an
-- infrastructure-level restriction rather than a config error).
--
-- Registration now creates the auth user via the admin API with
-- email_confirm:false (which does not trigger Supabase's mailer at all),
-- and this table backs a self-issued token emailed through the app's own
-- already-working Resend HTTP API integration (src/lib/email.ts) instead.
create table email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token uuid not null default gen_random_uuid() unique,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);
create index email_verification_tokens_user_id_idx on email_verification_tokens(user_id);

alter table email_verification_tokens enable row level security;
-- No policies: every read/write goes through server routes on the
-- service-role client -- verification must work for a not-yet-signed-in
-- visitor looking up their own token, which a per-user RLS policy can't
-- express safely (same reasoning as the invitations table).
