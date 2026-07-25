// Deliberately no "use client" here — this must be callable from server
// Route Handlers too (which pass their own `opts.client`). Next's RSC
// compiler treats every export of a "use client" module as a client-only
// reference, so a server caller importing logAudit from such a module
// throws at call time even though the function body itself is plain TS.
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// `opts.client` lets a server route pass its own server/admin client instead
// of the default browser client. Admin/service-role clients have no user
// session for `auth.getUser()` to resolve, so a server caller should also
// pass `actorId`/`actorEmail` (resolved from its own request-scoped session
// client beforehand) rather than relying on auto-detection.
export async function logAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
  opts?: { client?: SupabaseClient; actorId?: string; actorEmail?: string }
) {
  const supabase = opts?.client ?? createClient();

  let actorId = opts?.actorId ?? null;
  let actorEmail = opts?.actorEmail ?? null;
  if (!opts?.actorId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    actorId = user?.id ?? null;
    actorEmail = user?.email ?? null;
  }

  await supabase.from("audit_log").insert({
    actor_id: actorId,
    actor_email: actorEmail,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}
