import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Secret-authenticated JSON pull feed -- the "REST API / JSON Feed / API
// Keys" connection method from the spec: an external CRM (or a Zapier/
// Make polling step) can pull this owner's own clients and open
// property requests on its own schedule, using the same secret the
// webhook path signs with.
export async function GET(request: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;

  const admin = createAdminClient();
  const { data: integration } = await admin
    .from("crm_integrations")
    .select("id, owner_type, broker_id, salesperson_id, developer_id, status")
    .eq("secret", secret)
    .maybeSingle();

  if (!integration || integration.status !== "active") {
    return NextResponse.json({ error: "Invalid or inactive feed key." }, { status: 404 });
  }

  const ownerColumn = `${integration.owner_type}_id`;
  const ownerId = integration.owner_type === "broker" ? integration.broker_id : integration.owner_type === "salesperson" ? integration.salesperson_id : integration.developer_id;

  const [{ data: clients }, { data: propertyRequests }] = await Promise.all([
    admin.from("crm_clients").select("id, full_name, email, phone, whatsapp, source, status, created_at").eq(ownerColumn, ownerId),
    admin
      .from("property_requests")
      .select("id, request_id, property_type, budget_min, budget_max, status, created_at")
      .eq(ownerColumn, ownerId),
  ]);

  return NextResponse.json({ clients: clients ?? [], propertyRequests: propertyRequests ?? [] });
}
