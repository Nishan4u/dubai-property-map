import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

interface SendEmailInput {
  category: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

// Always logs to email_logs (pending -> sent/failed) and never throws —
// callers can fire this after a DB write has already committed and treat
// a failed send as a logged, retryable fact rather than a lost request.
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean }> {
  const supabase = createAdminClient();

  const { data: logRow } = await supabase
    .from("email_logs")
    .insert({
      category: input.category,
      to_email: input.to,
      subject: input.subject,
      body_html: input.html,
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
      reply_to: input.replyTo ?? null,
      status: "pending",
      attempt_count: 1,
    })
    .select("id")
    .single();

  const logId = logRow?.id as string | undefined;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (logId) {
      await supabase
        .from("email_logs")
        .update({ status: "failed", last_error: "RESEND_API_KEY or EMAIL_FROM is not configured." })
        .eq("id", logId);
    }
    return { ok: false };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    if (error) throw new Error(error.message);

    if (logId) {
      await supabase
        .from("email_logs")
        .update({ status: "sent", sent_at: new Date().toISOString(), resend_message_id: data?.id ?? null })
        .eq("id", logId);
    }
    return { ok: true };
  } catch (error) {
    if (logId) {
      await supabase
        .from("email_logs")
        .update({
          status: "failed",
          last_error: error instanceof Error ? error.message : "Unknown email error",
        })
        .eq("id", logId);
    }
    return { ok: false };
  }
}

// Re-sends the exact original subject/body of a previously logged email
// (used by Admin -> Email Logs -> Resend), without re-deriving it from the
// current state of whatever entity it was about.
export async function resendLoggedEmail(logId: string): Promise<{ ok: boolean }> {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("email_logs")
    .select("to_email, subject, body_html, category, reply_to, related_entity_type, related_entity_id")
    .eq("id", logId)
    .single();

  if (!row) return { ok: false };

  return sendEmail({
    category: row.category,
    to: row.to_email,
    subject: row.subject,
    html: row.body_html ?? "",
    replyTo: row.reply_to ?? undefined,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
  });
}
