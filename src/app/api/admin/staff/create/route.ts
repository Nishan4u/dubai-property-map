import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auditLog";
import { getAdminPermissionContext, hasModuleAccess } from "@/lib/permissions";

function slugifyCode(input: string) {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

export async function POST(request: NextRequest) {
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

  const { profile: permissionProfile, permissions } = await getAdminPermissionContext(supabase, user.id);
  if (!hasModuleAccess(permissionProfile, permissions, "staff", "manage")) {
    return NextResponse.json({ error: "You don't have permission to manage staff." }, { status: 403 });
  }

  const {
    fullName,
    email,
    phone,
    position,
    password,
    referralCode,
    commissionType,
    commissionRate,
  } = await request.json();

  if (!fullName?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Full name, email and a password (6+ characters) are required." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const code = referralCode?.trim() ? slugifyCode(referralCode) : slugifyCode(fullName).slice(0, 8) + Math.floor(Math.random() * 900 + 100);
  if (!code) {
    return NextResponse.json({ error: "Could not derive a referral code — provide one explicitly." }, { status: 400 });
  }

  const { data: existingCode } = await admin.from("staff").select("id").eq("referral_code", code).maybeSingle();
  if (existingCode) {
    return NextResponse.json({ error: `Referral code "${code}" is already in use.` }, { status: 400 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim(), role: "staff" },
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Could not create the account." }, { status: 400 });
  }

  const { data: staff, error: staffError } = await admin
    .from("staff")
    .insert({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone || null,
      position: position || null,
      referral_code: code,
      commission_type: commissionType === "flat" ? "flat" : "percentage",
      commission_rate: Number(commissionRate) || 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (staffError || !staff) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: staffError?.message ?? "Could not create the staff record." }, { status: 400 });
  }

  await admin.from("profiles").update({ role: "staff", staff_id: staff.id }).eq("id", created.user.id);

  await logAudit("staff.created", "staff", staff.id, { fullName, email }, { client: admin, actorId: user.id, actorEmail: user.email });

  return NextResponse.json({ staff, credentials: { email: email.trim(), password } });
}
