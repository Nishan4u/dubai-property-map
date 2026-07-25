import { MediaLibraryClient } from "@/components/dashboard/MediaLibraryClient";
import { getProjectsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const profile = await requireDeveloperProfile();
  const projects = await getProjectsForDeveloper(profile.developer_id);

  return (
    <MediaLibraryClient
      title="Documents"
      description="Brochures, factsheets, payment plans and price lists per project."
      folder="documents"
      accept="application/pdf"
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
