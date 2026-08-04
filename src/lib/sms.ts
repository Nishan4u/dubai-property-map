import { createAdminClient } from "@/lib/supabase/admin";

interface SendSmsInput {
  to: string;
  body: string;
  campaignId?: string;
}

// Mirrors sendEmail()'s shape exactly: always logs to sms_logs
// (pending -> sent/failed) and never throws. Uses Twilio's plain REST API
// via fetch (Basic Auth) rather than the Twilio SDK, since no other
// vendor SDK dependency is needed for a single POST. No real Twilio
// account exists for this platform yet -- when the env vars below aren't
// set, this clearly logs "SMS not configured" and returns ok: false
// rather than fabricating a sent message.
export async function sendSms(input: SendSmsInput): Promise<{ ok: boolean }> {
  const supabase = createAdminClient();

  const { data: logRow } = await supabase
    .from("sms_logs")
    .insert({
      campaign_id: input.campaignId ?? null,
      to_phone: input.to,
      body: input.body,
      status: "pending",
    })
    .select("id")
    .single();

  const logId = logRow?.id as string | undefined;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    if (logId) {
      await supabase
        .from("sms_logs")
        .update({
          status: "failed",
          error: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER is not configured.",
        })
        .eq("id", logId);
    }
    return { ok: false };
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: input.to, From: from, Body: input.body }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text.slice(0, 500));
    }

    if (logId) {
      await supabase.from("sms_logs").update({ status: "sent" }).eq("id", logId);
    }
    return { ok: true };
  } catch (error) {
    if (logId) {
      await supabase
        .from("sms_logs")
        .update({ status: "failed", error: error instanceof Error ? error.message : "Unknown SMS error" })
        .eq("id", logId);
    }
    return { ok: false };
  }
}
