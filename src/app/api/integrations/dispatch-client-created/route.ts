import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchCrmEvent } from "@/lib/crmIntegrations";

// crm_clients inserts happen client-side (BrokerClientsTable.tsx,
// SalespersonClientsTable.tsx) so they can't safely dispatch a signed
// webhook themselves -- the secret must never reach the browser. This
// route re-reads the just-inserted row by id (source of truth, not the
// client-supplied payload) and dispatches from that. Fire-and-forget
// from both call sites; a failure here never affects the already-
// committed crm_clients row.
export async function POST(request: NextRequest) {
  const { clientId } = (await request.json()) as { clientId?: string };
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("crm_clients")
    .select("id, owner_type, broker_id, salesperson_id, developer_id, full_name, email, phone, source, status")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const ownerId = client.owner_type === "broker" ? client.broker_id : client.owner_type === "salesperson" ? client.salesperson_id : client.developer_id;
  if (ownerId) {
    await dispatchCrmEvent(client.owner_type as "broker" | "salesperson" | "developer", ownerId, "client.created", {
      id: client.id,
      fullName: client.full_name,
      email: client.email,
      phone: client.phone,
      source: client.source,
      status: client.status,
    });
  }

  return NextResponse.json({ ok: true });
}
