import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Best-effort, mirrors sendLeadWebhook's exact contract (src/lib/notify.ts):
// the notification this rides alongside has already committed, so a push
// failure here must never surface to the caller. No-ops cleanly (not an
// error) when VAPID isn't configured yet -- same "not configured, not
// fabricated" pattern as src/lib/sms.ts.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return;

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions?.length) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (error) {
        // 404/410 means the browser dropped the subscription (uninstalled,
        // cleared data, expired) -- clean it up so future sends don't keep
        // retrying a dead endpoint. Any other error (network blip, etc.)
        // just gets swallowed, same as every other best-effort dispatch.
        const status = (error as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
