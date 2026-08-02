import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

// Narrow, single-purpose route: property_requests gives brokers only
// INSERT + SELECT (no UPDATE policy at all -- status transitions are
// deliberately salesperson/developer-owned, see patch_35's own comments).
// Rather than widen that with a broad broker UPDATE RLS policy (which would
// also open status/salesperson_id/project_id etc. to broker writes, since
// RLS is row-level, not column-level), this route verifies ownership of
// both the request and the client itself, then writes only client_id via
// the service-role client. Salespersons don't need an equivalent route --
// their existing "updates assigned" policy has no column restriction, so
// setting client_id there is just another field in the same direct client
// update MyLeadsTable.tsx already does for status changes.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { clientId } = (await request.json()) as { clientId?: string | null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("broker_id").eq("id", user.id).single();
  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: propertyRequest } = await admin.from("property_requests").select("id, broker_id").eq("id", id).single();
  if (!propertyRequest || propertyRequest.broker_id !== profile.broker_id) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (clientId) {
    const { data: client } = await admin.from("crm_clients").select("id, broker_id").eq("id", clientId).single();
    if (!client || client.broker_id !== profile.broker_id) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
  }

  const { error } = await admin
    .from("property_requests")
    .update({ client_id: clientId ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(
    "property_request.link_client",
    "property_request",
    id,
    { clientId: clientId ?? null },
    { client: admin, actorId: user.id, actorEmail: user.email }
  );

  return NextResponse.json({ ok: true });
}
