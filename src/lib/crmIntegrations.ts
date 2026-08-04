import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type OwnerType = "broker" | "salesperson" | "developer";
export type CrmEvent = "lead.created" | "client.created";

// Best-effort outbound dispatch to every active integration the given
// owner has subscribed to this event -- mirrors sendLeadWebhook's
// (src/lib/notify.ts) "the record itself has already committed, this
// must never affect that" contract. Never throws. Every attempt is
// logged to crm_integration_logs regardless of outcome.
export async function dispatchCrmEvent(ownerType: OwnerType, ownerId: string, event: CrmEvent, payload: Record<string, unknown>) {
  const admin = createAdminClient();
  const ownerColumn = `${ownerType}_id`;

  const { data: integrations } = await admin
    .from("crm_integrations")
    .select("id, webhook_url, secret")
    .eq(ownerColumn, ownerId)
    .eq("status", "active")
    .contains("events", [event]);

  if (!integrations?.length) return;

  await Promise.all(
    integrations.map(async (integration) => {
      if (!integration.webhook_url) return;
      const body = JSON.stringify({ event, data: payload });
      const signature = crypto.createHmac("sha256", integration.secret).update(body).digest("hex");

      try {
        const res = await fetch(integration.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Signature": signature },
          body,
        });
        await admin.from("crm_integration_logs").insert({
          integration_id: integration.id,
          event,
          status: res.ok ? "success" : "failed",
          response_code: res.status,
          error: res.ok ? null : `HTTP ${res.status}`,
        });
      } catch (error) {
        await admin.from("crm_integration_logs").insert({
          integration_id: integration.id,
          event,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown webhook error",
        });
      }
    })
  );
}
