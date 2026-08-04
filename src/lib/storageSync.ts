import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

// Supabase Storage's .list() is one level deep per call and returns
// subfolders as entries with id: null (ProjectFileManager.tsx's own
// upload/list code already relies on this to tell files from folders) --
// this recurses through the "documents" folder's category subfolders the
// same way, and no-ops harmlessly on "gallery", which has none.
async function listAllFilesRecursive(admin: Admin, path: string): Promise<string[]> {
  const { data, error } = await admin.storage.from("project-media").list(path);
  if (error || !data) return [];

  const files: string[] = [];
  for (const entry of data) {
    if (entry.name === ".emptyFolderPlaceholder") continue;
    if (entry.id === null) {
      files.push(...(await listAllFilesRecursive(admin, `${path}/${entry.name}`)));
    } else {
      files.push(`${path}/${entry.name}`);
    }
  }
  return files;
}

// One-way, on-demand mirror of a developer's own already-uploaded project
// media (gallery + documents, under the shared "project-media" Supabase
// Storage bucket) into their configured S3 bucket. Re-uploads everything
// on every call rather than tracking deltas -- simple and correct for a
// first pass, not optimized for very large catalogs. Never throws --
// records the outcome on the connection row itself so the UI can show
// it, mirroring dispatchCrmEvent's (src/lib/crmIntegrations.ts)
// "log the outcome, never let a failure propagate" contract.
export async function syncDeveloperMediaToS3(developerId: string): Promise<{ ok: boolean; fileCount?: number; error?: string }> {
  const admin = createAdminClient();

  const { data: connection } = await admin
    .from("storage_connections")
    .select("*")
    .eq("developer_id", developerId)
    .eq("status", "active")
    .maybeSingle();

  if (!connection) return { ok: false, error: "No active storage connection configured." };

  const { data: projects } = await admin.from("projects").select("id, slug").eq("developer_id", developerId);

  if (!projects?.length) {
    await admin
      .from("storage_connections")
      .update({ last_synced_at: new Date().toISOString(), last_sync_file_count: 0, last_sync_error: null })
      .eq("id", connection.id);
    return { ok: true, fileCount: 0 };
  }

  const s3 = new S3Client({
    region: connection.region,
    credentials: { accessKeyId: connection.access_key_id, secretAccessKey: connection.secret_access_key },
  });

  try {
    let fileCount = 0;
    for (const project of projects) {
      for (const folder of ["gallery", "documents"]) {
        const filePaths = await listAllFilesRecursive(admin, `${project.id}/${folder}`);
        for (const filePath of filePaths) {
          const { data: blob, error: downloadError } = await admin.storage.from("project-media").download(filePath);
          if (downloadError || !blob) continue;

          const key = `${project.slug}/${filePath.split("/").slice(1).join("/")}`;
          await s3.send(
            new PutObjectCommand({
              Bucket: connection.bucket_name,
              Key: key,
              Body: Buffer.from(await blob.arrayBuffer()),
              ContentType: blob.type || undefined,
            })
          );
          fileCount++;
        }
      }
    }

    await admin
      .from("storage_connections")
      .update({ last_synced_at: new Date().toISOString(), last_sync_file_count: fileCount, last_sync_error: null })
      .eq("id", connection.id);
    return { ok: true, fileCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown storage sync error";
    await admin.from("storage_connections").update({ last_sync_error: message }).eq("id", connection.id);
    return { ok: false, error: message };
  }
}
