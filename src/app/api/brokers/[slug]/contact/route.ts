import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Spec section 8: "Only registered users can view Broker contact details."
// Mirrors /api/account/verification-status's exact "registered/verified/
// active" bar (same one already enforced by is_verified_active_user() for
// leads/bookings) -- a guest's request never even reaches the point where
// email/mobile/whatsapp are read from the database, let alone returned.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: "guest" }, { status: 401 });
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json({ status: "unverified" }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, developer_id, broker_id, salesperson_id, suspended")
    .eq("id", user.id)
    .single();

  if (!profile || profile.suspended) {
    return NextResponse.json({ status: "inactive" }, { status: 403 });
  }

  let ok = profile.role === "buyer" || profile.role === "admin";
  if (!ok && profile.role === "developer" && profile.developer_id) {
    const { data } = await supabase.from("developers").select("status").eq("id", profile.developer_id).single();
    ok = data?.status === "active";
  }
  if (!ok && profile.role === "broker" && profile.broker_id) {
    const { data } = await supabase.from("brokers").select("account_status").eq("id", profile.broker_id).single();
    ok = data?.account_status === "approved";
  }
  if (!ok && profile.role === "salesperson" && profile.salesperson_id) {
    const { data } = await supabase.from("salespersons").select("status").eq("id", profile.salesperson_id).single();
    ok = data?.status === "active";
  }
  if (!ok && profile.role === "broker_agency") {
    ok = true;
  }

  if (!ok) {
    return NextResponse.json({ status: "inactive" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: broker } = await admin
    .from("brokers")
    .select("email, mobile, whatsapp, account_status")
    .eq("slug", slug)
    .maybeSingle();

  if (!broker || broker.account_status !== "approved") {
    return NextResponse.json({ error: "Broker not found." }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", email: broker.email, mobile: broker.mobile, whatsapp: broker.whatsapp });
}
