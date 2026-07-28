import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export type InvitationKind = "team_member" | "developer_salesperson" | "admin_member" | "admin_salesperson";

interface CreateInvitationInput {
  kind: InvitationKind;
  email: string;
  developerId?: string | null;
  role?: string | null;
  payload?: Record<string, unknown>;
  invitedBy: string;
  developerName?: string | null;
  inviterEmail?: string | null;
  origin?: string;
}

function buildInvitationEmail(
  kind: InvitationKind,
  acceptUrl: string,
  developerName?: string | null,
  role?: string | null
): { subject: string; html: string } {
  switch (kind) {
    case "team_member":
      return {
        subject: `You've been invited to join ${developerName ?? "a developer team"} on Dubai Property Map`,
        html: `<p>Hi,</p><p>You've been invited to join <strong>${developerName ?? "a developer"}</strong>'s team on Dubai Property Map${role ? ` as <strong>${role}</strong>` : ""}.</p><p><a href="${acceptUrl}">Accept your invitation</a> to set your password and get started.</p><p>This link expires in 7 days.</p>`,
      };
    case "developer_salesperson":
    case "admin_salesperson":
      return {
        subject: `You've been invited to join ${developerName ?? "a developer"} on Dubai Property Map`,
        html: `<p>Hi,</p><p>You've been invited to join <strong>${developerName ?? "a developer"}</strong> as a salesperson on Dubai Property Map.</p><p><a href="${acceptUrl}">Accept your invitation</a> to set your password and activate your account.</p><p>This link expires in 7 days.</p>`,
      };
    case "admin_member":
      return {
        subject: "You've been invited to join the Dubai Property Map admin team",
        html: `<p>Hi,</p><p>You've been invited to join the Dubai Property Map admin team.</p><p><a href="${acceptUrl}">Accept your invitation</a> to set your password and get started.</p><p>This link expires in 7 days.</p>`,
      };
  }
}

// Creates the invitation row and attempts the send synchronously so the
// caller can show an immediate Sent/Failed result rather than a fire-and-
// forget email with no feedback — this is the exact gap that left the
// previous 4 invite flows silently not sending anything.
export async function createInvitation(input: CreateInvitationInput) {
  const admin = createAdminClient();

  const { data: invitation, error } = await admin
    .from("invitations")
    .insert({
      kind: input.kind,
      email: input.email.trim().toLowerCase(),
      developer_id: input.developerId ?? null,
      role: input.role ?? null,
      payload: input.payload ?? {},
      invited_by: input.invitedBy,
    })
    .select()
    .single();

  if (error || !invitation) {
    return { invitation: null, error: error?.message ?? "Could not create invitation." };
  }

  const result = await sendInvitationEmailById(invitation.id, input.developerName, input.inviterEmail, input.origin);
  return { invitation: { ...invitation, status: result.ok ? "sent" : "failed" }, error: null };
}

export async function sendInvitationEmailById(
  invitationId: string,
  developerName?: string | null,
  inviterEmail?: string | null,
  origin?: string
) {
  const admin = createAdminClient();
  const { data: invitation } = await admin.from("invitations").select("*").eq("id", invitationId).single();
  if (!invitation) return { ok: false };

  // Same reasoning as createAndSendVerificationToken: prefer the actual
  // request origin over the build-time-inlined env var.
  const resolvedOrigin = origin || process.env.NEXT_PUBLIC_SITE_URL || "https://dubaipropertymap.ae";
  const acceptUrl = `${resolvedOrigin}/invite/accept?token=${invitation.token}`;
  const { subject, html } = buildInvitationEmail(
    invitation.kind as InvitationKind,
    acceptUrl,
    developerName,
    invitation.role
  );

  const result = await sendEmail({
    category: "invitation",
    to: invitation.email,
    subject,
    html,
    replyTo: inviterEmail ?? undefined,
    relatedEntityType: "invitation",
    relatedEntityId: invitation.id,
  });

  await admin
    .from("invitations")
    .update(
      result.ok
        ? { status: "sent", sent_at: new Date().toISOString(), last_error: null }
        : { status: "failed", last_error: "See email_logs for details." }
    )
    .eq("id", invitationId);

  return result;
}
