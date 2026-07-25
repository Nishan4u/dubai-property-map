import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { name, email, password } = await request.json();
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Company name, email and a password (6+ characters) are required." },
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
    user_metadata: { full_name: name.trim(), role: "developer" },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create the account." },
      { status: 400 }
    );
  }

  const slug = `${slugify(name)}-${created.user.id.slice(0, 6)}`;
  const { data: developer, error: devError } = await admin
    .from("developers")
    .insert({
      slug,
      name: name.trim(),
      initial: name.trim().charAt(0).toUpperCase(),
      status: "active",
      verified: true,
    })
    .select()
    .single();

  if (devError || !developer) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: devError?.message ?? "Could not create the developer profile." },
      { status: 400 }
    );
  }

  await admin
    .from("profiles")
    .update({ developer_id: developer.id })
    .eq("id", created.user.id);

  return NextResponse.json({ developer });
}
