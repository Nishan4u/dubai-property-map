import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const REMINDER_DAYS = [7, 3, 1, 0] as const;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: brokers } = await supabase
    .from("brokers")
    .select("id, full_name, email, subscription_expires_at, last_reminder_sent_days")
    .eq("subscription_status", "active")
    .not("subscription_expires_at", "is", null);

  let remindersSent = 0;
  let expired = 0;

  for (const broker of brokers ?? []) {
    const expiresAt = new Date(`${broker.subscription_expires_at}T00:00:00Z`);
    const daysLeft = Math.round((expiresAt.getTime() - today.getTime()) / 86_400_000);

    if (daysLeft < 0) {
      await supabase.from("brokers").update({ subscription_status: "expired" }).eq("id", broker.id);
      expired++;
      continue;
    }

    const bucket = REMINDER_DAYS.find((d) => d === daysLeft);
    if (bucket === undefined || broker.last_reminder_sent_days === bucket) continue;

    const subject =
      bucket === 0
        ? "Your Dubai Property Map subscription has expired today"
        : `Your Dubai Property Map subscription expires in ${bucket} day${bucket === 1 ? "" : "s"}`;
    const html = `<p>Hi ${broker.full_name},</p><p>${
      bucket === 0
        ? "Your broker membership expires today."
        : `Your broker membership expires in ${bucket} day${bucket === 1 ? "" : "s"}.`
    } Renew from your Dubai Property Map dashboard to keep submitting property requests.</p>`;

    await sendEmail({
      category: "broker_subscription_reminder",
      to: broker.email,
      subject,
      html,
      relatedEntityType: "broker",
      relatedEntityId: broker.id,
    });
    await supabase.from("brokers").update({ last_reminder_sent_days: bucket }).eq("id", broker.id);
    remindersSent++;
  }

  return NextResponse.json({ remindersSent, expired });
}
