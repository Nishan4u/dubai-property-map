-- Brokers already support an 'expired' subscription_status and track
-- last_reminder_sent_days so the reminder cron doesn't re-send the same
-- day-bucket reminder repeatedly. Developers and salespersons need the same
-- for the expiry-reminder cron to cover all three account types.
alter table developers drop constraint if exists developers_subscription_status_check;
alter table developers add constraint developers_subscription_status_check
  check (subscription_status in ('inactive', 'active', 'past_due', 'cancelled', 'expired'));

alter table developers add column if not exists last_reminder_sent_days int;
revoke update (last_reminder_sent_days) on developers from authenticated;

alter table salespersons add column if not exists last_reminder_sent_days int;
revoke update (last_reminder_sent_days) on salespersons from authenticated;
