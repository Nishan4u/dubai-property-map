-- Missed when patch_60 added billing columns to brokerages: brokers,
-- salespersons and developers all have last_reminder_sent_days (added in
-- patch_47) so the expiry-reminder cron doesn't re-send the same reminder
-- twice. The broker agency bank-transfer-approval and Stripe-webhook code
-- paths both write to this column on brokerages, so without it every
-- broker agency bank-transfer approval and Stripe checkout silently
-- 500'd after marking the transfer "paid"/activating the Stripe side,
-- while never actually activating brokerages.subscription_status.
alter table brokerages add column if not exists last_reminder_sent_days int;
revoke update (last_reminder_sent_days) on brokerages from authenticated;

notify pgrst, 'reload schema';
