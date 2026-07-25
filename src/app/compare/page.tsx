import { PublicShell } from "@/components/public/PublicShell";
import { CompareClient } from "@/components/public/CompareClient";
import { getPublishedProjects } from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const rows = await getPublishedProjects();
  const projects = rows.map((r) => mapProject(r));

  return (
    <PublicShell>
      <CompareClient projects={projects} />
    </PublicShell>
  );
}
