import { CompareClient } from "@/components/public/CompareClient";
import { getPublishedProjects, requireBrokerProfile } from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

// Rendered directly inside the broker portal shell (no PublicShell/
// ProjectAccessGate -- the portal layout already gates/chromes it, same
// pattern as src/app/broker/projects/page.tsx). `ownerContext` is what
// turns on CompareClient's "Create Presentation" button -- absent on the
// fully public /compare page.
export default async function BrokerComparePage() {
  const profile = await requireBrokerProfile();
  const rows = await getPublishedProjects();
  const projects = rows.map((r) => mapProject(r));

  return (
    <div className="p-6">
      <CompareClient
        projects={projects}
        ownerContext={{ ownerType: "broker", ownerId: profile.broker_id }}
      />
    </div>
  );
}
