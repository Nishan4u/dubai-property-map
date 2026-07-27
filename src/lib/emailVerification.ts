import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

// Supabase Auth's own confirmation email depends on their outbound SMTP,
// which is broken at the platform level (see patch_58 for the full
// diagnosis) -- this issues our own token and sends it via the app's
// already-working Resend HTTP API integration instead.
export async function createAndSendVerificationToken(userId: string, email: string, fullName: string, next: string) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("email_verification_tokens")
    .select("created_at")
    .eq("user_id", userId)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Same 60s cooldown the resend button already enforces client-side --
  // this is the server-side backstop against spam-clicking or scripted abuse.
  if (existing && Date.now() - new Date(existing.created_at).getTime() < 60_000) {
    return { ok: true };
  }

  const { data: tokenRow, error } = await admin
    .from("email_verification_tokens")
    .insert({ user_id: userId, email })
    .select("token")
    .single();

  if (error || !tokenRow) return { ok: false };

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://dubaipropertymap.ae";
  const confirmUrl = `${origin}/api/auth/verify-email?token=${tokenRow.token}&next=${encodeURIComponent(next)}`;

  return sendEmail({
    category: "signup_verification",
    to: email,
    subject: "Confirm your email address",
    html: `<h2>Confirm your email address</h2><p>Hi ${fullName || "there"},</p><p>Follow the link below to confirm this email address and finish signing up.</p><p><a href="${confirmUrl}">Confirm email address</a></p><p>This link expires in 24 hours.</p>`,
  });
}
