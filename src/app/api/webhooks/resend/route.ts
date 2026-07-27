import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Resend signs webhooks using Svix's scheme (no svix package dependency —
// this is a plain HMAC-SHA256 over "{id}.{timestamp}.{body}", verified
// manually to avoid pulling in a new dependency for something this small).
function verifySignature(body: string, headers: { id: string; timestamp: string; signature: string }, secret: string) {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${headers.id}.${headers.timestamp}.${body}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  return headers.signature
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter(Boolean)
    .some((sig) => {
      try {
        return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
      } catch {
        return false;
      }
    });
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
  }

  const body = await request.text();
  const valid = verifySignature(body, { id: svixId, timestamp: svixTimestamp, signature: svixSignature }, secret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body) as { type: string; data?: { email_id?: string } };
  const messageId = event.data?.email_id;
  if (!messageId) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const statusByEvent: Record<string, string> = {
    "email.delivered": "delivered",
    "email.bounced": "bounced",
    "email.complained": "complained",
  };
  const status = statusByEvent[event.type];
  if (status) {
    await admin
      .from("email_logs")
      .update({
        status,
        ...(status === "bounced" ? { bounced_at: new Date().toISOString() } : {}),
      })
      .eq("resend_message_id", messageId);
  }

  return NextResponse.json({ received: true });
}
