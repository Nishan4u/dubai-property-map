import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncDeveloperMediaToS3 } from "@/lib/storageSync";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role, developer_id").eq("id", user.id).single();
  if (profile?.role !== "developer" || !profile.developer_id) {
    return NextResponse.json({ error: "Developer account required." }, { status: 403 });
  }

  const result = await syncDeveloperMediaToS3(profile.developer_id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Sync failed." }, { status: 500 });
  }

  return NextResponse.json(result);
}
