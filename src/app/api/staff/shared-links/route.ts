import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function randomCode() {
  return Math.random().toString(36).slice(2, 9);
}

// Idempotent per (staff, target) — calling this again for the same
// project/developer just returns the same share link rather than
// generating duplicates.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("staff_id").eq("id", user.id).single();
  if (!profile?.staff_id) {
    return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  }

  const { targetType, targetId } = (await request.json()) as { targetType: "project" | "developer"; targetId: string };
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "targetType and targetId are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("staff_shared_links")
    .select("share_code")
    .eq("staff_id", profile.staff_id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ shareCode: existing.share_code });
  }

  let shareCode = randomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: created, error } = await admin
      .from("staff_shared_links")
      .insert({ staff_id: profile.staff_id, target_type: targetType, target_id: targetId, share_code: shareCode })
      .select("share_code")
      .single();
    if (!error && created) {
      return NextResponse.json({ shareCode: created.share_code });
    }
    shareCode = randomCode();
  }

  return NextResponse.json({ error: "Could not create share link." }, { status: 500 });
}
