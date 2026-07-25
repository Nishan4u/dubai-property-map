import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mirrors is_verified_active_user() (patch_40) so the UI can show a helpful
// "Registration Required" / "Account pending" message instead of a raw
// insert error — the RLS policy is what actually enforces this, this route
// only decides what to render.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: "guest" });
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json({ status: "unverified" });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, developer_id, broker_id, salesperson_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ status: "unverified" });
  }

  if (profile.role === "buyer" || profile.role === "admin") {
    return NextResponse.json({ status: "ok" });
  }

  if (profile.role === "developer" && profile.developer_id) {
    const { data } = await supabase
      .from("developers")
      .select("status")
      .eq("id", profile.developer_id)
      .single();
    return NextResponse.json({ status: data?.status === "active" ? "ok" : "inactive" });
  }

  if (profile.role === "broker" && profile.broker_id) {
    const { data } = await supabase
      .from("brokers")
      .select("account_status")
      .eq("id", profile.broker_id)
      .single();
    return NextResponse.json({ status: data?.account_status === "approved" ? "ok" : "inactive" });
  }

  if (profile.role === "salesperson" && profile.salesperson_id) {
    const { data } = await supabase
      .from("salespersons")
      .select("status")
      .eq("id", profile.salesperson_id)
      .single();
    return NextResponse.json({ status: data?.status === "active" ? "ok" : "inactive" });
  }

  return NextResponse.json({ status: "inactive" });
}
