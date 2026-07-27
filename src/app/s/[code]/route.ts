import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public redirect — anyone (including guests) can follow a shared link.
// Logs a click for staff analytics and drops a short-lived cookie carrying
// the staff's referral code, so if this visitor later registers and
// subscribes, checkout can attribute it automatically. The click itself
// never generates commission — only an actual paid subscription does.
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const origin = request.nextUrl.origin;
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("staff_shared_links")
    .select("id, target_type, target_id, staff:staff_id(referral_code)")
    .eq("share_code", code)
    .maybeSingle();

  if (!link) {
    return NextResponse.redirect(origin);
  }

  await admin.from("staff_link_clicks").insert({ shared_link_id: link.id });

  let destination = origin;
  if (link.target_type === "project") {
    const { data: project } = await admin.from("projects").select("slug").eq("id", link.target_id).maybeSingle();
    if (project?.slug) destination = `${origin}/projects/${project.slug}`;
  } else if (link.target_type === "developer") {
    const { data: developer } = await admin.from("developers").select("slug").eq("id", link.target_id).maybeSingle();
    if (developer?.slug) destination = `${origin}/developers/${developer.slug}`;
  }

  const response = NextResponse.redirect(destination);
  const staffRow = Array.isArray(link.staff) ? link.staff[0] : link.staff;
  const referralCode = (staffRow as { referral_code?: string } | undefined)?.referral_code;
  if (referralCode) {
    response.cookies.set("dpm_ref", referralCode, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
  }
  return response;
}
