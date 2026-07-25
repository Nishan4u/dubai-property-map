import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
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

  const { fullName, jobTitle, employeeId, email, mobile, whatsapp, password } = await request.json();
  if (!fullName?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Full name, email and a password (6+ characters) are required." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin client is not configured." },
      { status: 500 }
    );
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim(), role: "salesperson" },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create the account." },
      { status: 400 }
    );
  }

  // developer_id is always taken from the caller's own session, never from
  // the request body — a developer admin can only ever create salespersons
  // under their own roster.
  const { data: salesperson, error: spError } = await admin
    .from("salespersons")
    .insert({
      developer_id: profile.developer_id,
      full_name: fullName.trim(),
      job_title: jobTitle || null,
      employee_id: employeeId || null,
      email: email.trim(),
      mobile: mobile || null,
      whatsapp: whatsapp || null,
      status: "active",
      created_by: user.id,
    })
    .select()
    .single();

  if (spError || !salesperson) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: spError?.message ?? "Could not create the salesperson profile." },
      { status: 400 }
    );
  }

  await admin.from("profiles").update({ salesperson_id: salesperson.id }).eq("id", created.user.id);

  return NextResponse.json({ salesperson, credentials: { email: email.trim(), password } });
}
