import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { password } = await request.json();
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, developer_id")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "developer" || !profile.developer_id) {
    return NextResponse.json({ error: "Developer access required." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: salesperson } = await admin.from("salespersons").select("developer_id").eq("id", id).single();
  if (!salesperson || salesperson.developer_id !== profile.developer_id) {
    return NextResponse.json({ error: "Salesperson not found." }, { status: 404 });
  }

  const { data: spProfile } = await admin.from("profiles").select("id").eq("salesperson_id", id).maybeSingle();
  if (!spProfile) {
    return NextResponse.json({ error: "No linked login account found." }, { status: 404 });
  }

  const { error } = await admin.auth.admin.updateUserById(spProfile.id, { password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
