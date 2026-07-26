-- Reply-To routing for automated emails (e.g. a broker property-request
-- notification to a salesperson should reply-to the broker, not the
-- platform's From address). Logged alongside every send for admin QA
-- visibility in Email Logs.
alter table email_logs add column if not exists reply_to text;
