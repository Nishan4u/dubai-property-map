import { MediaLibraryClient } from "@/components/dashboard/MediaLibraryClient";
import { getProjectsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const profile = await requireDeveloperProfile();
  const projects = await getProjectsForDeveloper(profile.developer_id);

  return (
    <MediaLibraryClient
      title="Media Library"
      description="Upload images, drone shots and other visuals for each project."
      folder="gallery"
      accept="image/*,video/*"
      projects={projects.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
