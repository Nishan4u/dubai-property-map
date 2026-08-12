import { CompareClient } from "@/components/public/CompareClient";
import { getPublishedProjects, requireSalespersonProfile } from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

// Mirrors src/app/broker/compare/page.tsx -- see it for context.
export default async function SalespersonComparePage() {
  const profile = await requireSalespersonProfile();
  const rows = await getPublishedProjects();
  const projects = rows.map((r) => mapProject(r));

  return (
    <div className="p-6">
      <CompareClient
        projects={projects}
        ownerContext={{ ownerType: "salesperson", ownerId: profile.salesperson_id }}
      />
    </div>
  );
}
