-- Salesperson self-registration + developer lead/broker-request privacy
-- lockdown. Two independent changes bundled in one migration since both
-- were requested together:
--
-- 1. Developers get an admin-configured "approved email domain" so a
--    salesperson can self-register by proving they hold an email on that
--    domain (verified via Supabase's existing signup-confirmation flow —
--    no separate OTP/verification system needed, since a session can only
--    exist post-confirmation for a signUp() that required it).
-- 2. The Developer Account must NOT see broker property requests, broker
--    contact details, or salesperson leads at all — this was previously
--    readable via RLS policies added in patch_35/patch_36. Enforcing this
--    at the RLS layer (not just hiding the UI) per explicit requirement.

alter table developers add column approved_email_domain text;

-- ---------- Privacy lockdown: revoke developer visibility ----------
drop policy if exists "property_requests: developer reads own company requests" on property_requests;
drop policy if exists "property_requests: developer reassigns own company requests" on property_requests;
drop policy if exists "brokers: developer reads own company request brokers" on brokers;
-- Developers also lose read access to salesperson-authored status history
-- notes for the same reason (it's derived from property_requests, which
-- they can no longer see at all).
drop policy if exists "property_request_status_history: developer reads own company history" on property_request_status_history;
drop policy if exists "property_request_status_history: developer inserts for own company" on property_request_status_history;

-- ---------- Self-service salesperson registration RPC ----------
-- Only callable once a real session exists — for a signUp() that required
-- email confirmation (which this flow always uses), that means the email
-- is already verified by the time this can run. Re-validates the domain
-- server-side too, never trusting the client-side check alone.
create or replace function claim_salesperson_profile(
  p_developer_id uuid,
  p_full_name text,
  p_job_title text,
  p_employee_id text,
  p_mobile text,
  p_whatsapp text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
  v_email text;
  v_salesperson_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  if (select role from profiles where id = auth.uid()) <> 'salesperson' then
    raise exception 'Only a salesperson-role account can complete this registration.';
  end if;

  if (select salesperson_id from profiles where id = auth.uid()) is not null then
    raise exception 'This account is already linked to a salesperson profile.';
  end if;

  select approved_email_domain into v_domain from developers where id = p_developer_id;
  if v_domain is null or trim(v_domain) = '' then
    raise exception 'This developer has not configured salesperson email verification yet.';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if v_email is null or lower(split_part(v_email, '@', 2)) <> lower(trim(leading '@' from v_domain)) then
    raise exception 'Your account email does not match this developer''s approved domain.';
  end if;

  insert into salespersons (developer_id, full_name, job_title, employee_id, email, mobile, whatsapp, status, created_by)
  values (p_developer_id, p_full_name, p_job_title, p_employee_id, v_email, p_mobile, p_whatsapp, 'active', auth.uid())
  returning id into v_salesperson_id;

  update profiles set salesperson_id = v_salesperson_id where id = auth.uid();

  return v_salesperson_id;
end;
$$;

grant execute on function claim_salesperson_profile(uuid, text, text, text, text, text) to authenticated;
