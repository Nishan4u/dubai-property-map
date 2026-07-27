import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAndSendVerificationToken } from "@/lib/emailVerification";

type Role = "buyer" | "developer" | "broker" | "salesperson";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const fullName = (body.fullName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role = (body.role ?? "buyer") as Role;
  const developerId = body.developerId as string | undefined;
  const jobTitle = body.jobTitle as string | undefined;
  const mobile = body.mobile as string | undefined;
  const whatsapp = body.whatsapp as string | undefined;

  if (!fullName || !email || password.length < 6) {
    return NextResponse.json({ error: "Full name, email and a password (6+ characters) are required." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: typeSetting } = await admin
    .from("registration_type_settings")
    .select("enabled")
    .eq("account_type", role)
    .maybeSingle();
  if (typeSetting && !typeSetting.enabled) {
    return NextResponse.json({ error: "This account type isn't accepting new registrations right now." }, { status: 403 });
  }

  const userMetadata: Record<string, unknown> = { full_name: fullName, role };

  if (role === "salesperson") {
    if (!developerId) {
      return NextResponse.json({ error: "Please select the developer you work for." }, { status: 400 });
    }
    const { data: developer } = await admin.from("developers").select("name, approved_email_domain").eq("id", developerId).maybeSingle();
    if (!developer) {
      return NextResponse.json({ error: "Developer not found." }, { status: 400 });
    }
    if (!developer.approved_email_domain) {
      return NextResponse.json(
        { error: `${developer.name} hasn't configured salesperson email verification yet. Ask them to add you directly instead.` },
        { status: 400 }
      );
    }
    const domain = developer.approved_email_domain.replace(/^@/, "").toLowerCase();
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (emailDomain !== domain) {
      return NextResponse.json(
        { error: `Please use your official company email address to register as a salesperson for ${developer.name} (must end in @${domain}).` },
        { status: 400 }
      );
    }
    userMetadata.developer_id = developerId;
    userMetadata.job_title = jobTitle ?? "";
    userMetadata.mobile = mobile ?? "";
    userMetadata.whatsapp = whatsapp ?? "";
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: userMetadata,
  });

  if (error || !created.user) {
    const message = error?.message ?? "Could not create the account.";
    return NextResponse.json({ error: message.includes("already been registered") ? "An account with this email already exists." : message }, { status: 400 });
  }

  const next = role === "developer" ? "/dashboard" : role === "broker" ? "/broker" : role === "salesperson" ? "/salesperson" : "/";
  // The account exists either way at this point -- a failed send (logged in
  // email_logs) is recoverable via the "Resend confirmation email" button,
  // so it isn't treated as a request failure here.
  await createAndSendVerificationToken(created.user.id, email, fullName, next);

  return NextResponse.json({ ok: true });
}
