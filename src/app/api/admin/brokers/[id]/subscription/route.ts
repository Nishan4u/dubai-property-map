import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";

type Action = "extend" | "complimentary" | "cancel";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { action, days } = (await request.json()) as { action: Action; days?: number };
  const admin = createAdminClient();

  const { data: broker } = await admin.from("brokers").select("subscription_expires_at").eq("id", id).single();
  if (!broker) {
    return NextResponse.json({ error: "Broker not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  switch (action) {
    case "extend": {
      const extendDays = days ?? 30;
      const base = broker.subscription_expires_at && new Date(broker.subscription_expires_at) > new Date()
        ? new Date(broker.subscription_expires_at)
        : new Date();
      base.setDate(base.getDate() + extendDays);
      updates.subscription_expires_at = base.toISOString().slice(0, 10);
      updates.subscription_status = "active";
      break;
    }
    case "complimentary": {
      const expires = new Date();
      expires.setDate(expires.getDate() + 365);
      updates.is_complimentary = true;
      updates.subscription_status = "active";
      updates.subscription_expires_at = expires.toISOString().slice(0, 10);
      break;
    }
    case "cancel":
      updates.subscription_status = "cancelled";
      break;
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const { error } = await admin.from("brokers").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(`broker.subscription_${action}`, "broker", id, { days }, { client: admin, actorId: user.id, actorEmail: user.email });

  return NextResponse.json({ ok: true });
}
