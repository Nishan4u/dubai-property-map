export function getWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// Real send via Meta's WhatsApp Cloud API -- distinct from getWhatsAppUrl
// above, which just opens the visitor's own WhatsApp client with a
// prefilled message (no API/credentials involved). Mirrors sendSms()'s
// (src/lib/sms.ts) exact shape: always logs to whatsapp_logs (pending ->
// sent/failed), never throws. No real Meta Business/WhatsApp app exists
// for this platform yet -- when the env vars below aren't set, this
// clearly logs "not configured" and returns ok: false rather than
// fabricating a sent message.
export async function sendWhatsApp(input: { to: string; body: string; campaignId?: string }): Promise<{ ok: boolean }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: logRow } = await supabase
    .from("whatsapp_logs")
    .insert({
      campaign_id: input.campaignId ?? null,
      to_phone: input.to,
      body: input.body,
      status: "pending",
    })
    .select("id")
    .single();

  const logId = logRow?.id as string | undefined;

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    if (logId) {
      await supabase
        .from("whatsapp_logs")
        .update({
          status: "failed",
          error: "WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured.",
        })
        .eq("id", logId);
    }
    return { ok: false };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to.replace(/[^\d+]/g, ""),
        type: "text",
        text: { body: input.body },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text.slice(0, 500));
    }

    if (logId) {
      await supabase.from("whatsapp_logs").update({ status: "sent" }).eq("id", logId);
    }
    return { ok: true };
  } catch (error) {
    if (logId) {
      await supabase
        .from("whatsapp_logs")
        .update({ status: "failed", error: error instanceof Error ? error.message : "Unknown WhatsApp error" })
        .eq("id", logId);
    }
    return { ok: false };
  }
}
