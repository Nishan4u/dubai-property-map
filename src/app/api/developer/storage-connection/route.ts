import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Saves/updates the calling developer's own S3 connection. The secret
// access key is optional on update -- omit it to keep the currently
// stored value (avoids forcing re-entry of the secret every time a
// developer just wants to change the bucket name or region), matching
// the "leave blank to keep current" pattern common to any credential
// update form. Required on first save, since there's nothing to fall
// back to yet.
export async function POST(request: NextRequest) {
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

  const { bucketName, region, accessKeyId, secretAccessKey } = (await request.json()) as {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey?: string;
  };

  if (!bucketName?.trim() || !region?.trim() || !accessKeyId?.trim()) {
    return NextResponse.json({ error: "Bucket name, region, and access key ID are required." }, { status: 400 });
  }

  const admin = createAdminClient();

  let finalSecret = secretAccessKey?.trim();
  if (!finalSecret) {
    const { data: existing } = await admin
      .from("storage_connections")
      .select("secret_access_key")
      .eq("developer_id", profile.developer_id)
      .maybeSingle();
    finalSecret = existing?.secret_access_key;
  }
  if (!finalSecret) {
    return NextResponse.json({ error: "Secret access key is required." }, { status: 400 });
  }

  const { error } = await admin.from("storage_connections").upsert(
    {
      developer_id: profile.developer_id,
      bucket_name: bucketName.trim(),
      region: region.trim(),
      access_key_id: accessKeyId.trim(),
      secret_access_key: finalSecret,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "developer_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
