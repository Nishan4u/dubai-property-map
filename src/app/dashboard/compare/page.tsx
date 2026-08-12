import { CompareClient } from "@/components/public/CompareClient";
import { getPublishedProjects, requireDeveloperProfile } from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

// Mirrors src/app/broker/compare/page.tsx, but scoped to the developer's
// own catalogue only (getPublishedProjects(developerId)) -- a developer
// comparing/presenting only makes sense over their own projects, not
// competitors', matching dashboard/projects/[id]/page.tsx's existing
// scoping convention.
export default async function DeveloperComparePage() {
  const profile = await requireDeveloperProfile();
  const rows = await getPublishedProjects(profile.developer_id);
  const projects = rows.map((r) => mapProject(r));

  return (
    <div className="p-6">
      <CompareClient
        projects={projects}
        ownerContext={{ ownerType: "developer", ownerId: profile.developer_id }}
      />
    </div>
  );
}
