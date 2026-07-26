import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

// Mirrors /api/cron/broker-subscription-reminders — kept as a separate
// route rather than merged into it so the existing, already-scheduled
// broker job is untouched.
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

  let remindersSent = 0;
  let expired = 0;

  const { data: developers } = await supabase
    .from("developers")
    .select("id, name, email, subscription_expires_at, last_reminder_sent_days")
    .eq("subscription_status", "active")
    .not("subscription_expires_at", "is", null);

  for (const developer of developers ?? []) {
    if (!developer.email) continue;
    const expiresAt = new Date(`${developer.subscription_expires_at}T00:00:00Z`);
    const daysLeft = Math.round((expiresAt.getTime() - today.getTime()) / 86_400_000);

    if (daysLeft < 0) {
      await supabase.from("developers").update({ subscription_status: "expired" }).eq("id", developer.id);
      await sendEmail({
        category: "subscription_expired",
        to: developer.email,
        subject: "Your Dubai Property Map subscription has expired",
        html: `<p>Hi ${developer.name},</p><p>Your subscription has expired. Renew from your Dubai Property Map dashboard to keep your listings live.</p>`,
        relatedEntityType: "developer",
        relatedEntityId: developer.id,
      });
      expired++;
      continue;
    }

    const bucket = REMINDER_DAYS.find((d) => d === daysLeft);
    if (bucket === undefined || developer.last_reminder_sent_days === bucket) continue;

    await sendEmail({
      category: "subscription_reminder",
      to: developer.email,
      subject:
        bucket === 0
          ? "Your Dubai Property Map subscription expires today"
          : `Your Dubai Property Map subscription expires in ${bucket} day${bucket === 1 ? "" : "s"}`,
      html: `<p>Hi ${developer.name},</p><p>${
        bucket === 0
          ? "Your subscription expires today."
          : `Your subscription expires in ${bucket} day${bucket === 1 ? "" : "s"}.`
      } Renew from your dashboard to avoid losing paid-plan features.</p>`,
      relatedEntityType: "developer",
      relatedEntityId: developer.id,
    });
    await supabase.from("developers").update({ last_reminder_sent_days: bucket }).eq("id", developer.id);
    remindersSent++;
  }

  const { data: salespersons } = await supabase
    .from("salespersons")
    .select("id, full_name, email, subscription_expires_at, last_reminder_sent_days")
    .eq("subscription_status", "active")
    .not("subscription_expires_at", "is", null);

  for (const salesperson of salespersons ?? []) {
    const expiresAt = new Date(`${salesperson.subscription_expires_at}T00:00:00Z`);
    const daysLeft = Math.round((expiresAt.getTime() - today.getTime()) / 86_400_000);

    if (daysLeft < 0) {
      await supabase.from("salespersons").update({ subscription_status: "expired" }).eq("id", salesperson.id);
      await sendEmail({
        category: "subscription_expired",
        to: salesperson.email,
        subject: "Your Dubai Property Map subscription has expired",
        html: `<p>Hi ${salesperson.full_name},</p><p>Your subscription has expired. Renew from your Dubai Property Map dashboard to regain access.</p>`,
        relatedEntityType: "salesperson",
        relatedEntityId: salesperson.id,
      });
      expired++;
      continue;
    }

    const bucket = REMINDER_DAYS.find((d) => d === daysLeft);
    if (bucket === undefined || salesperson.last_reminder_sent_days === bucket) continue;

    await sendEmail({
      category: "subscription_reminder",
      to: salesperson.email,
      subject:
        bucket === 0
          ? "Your Dubai Property Map subscription expires today"
          : `Your Dubai Property Map subscription expires in ${bucket} day${bucket === 1 ? "" : "s"}`,
      html: `<p>Hi ${salesperson.full_name},</p><p>${
        bucket === 0
          ? "Your subscription expires today."
          : `Your subscription expires in ${bucket} day${bucket === 1 ? "" : "s"}.`
      } Renew from your dashboard to keep access to assigned leads.</p>`,
      relatedEntityType: "salesperson",
      relatedEntityId: salesperson.id,
    });
    await supabase.from("salespersons").update({ last_reminder_sent_days: bucket }).eq("id", salesperson.id);
    remindersSent++;
  }

  return NextResponse.json({ remindersSent, expired });
}
