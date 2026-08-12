import { FolderOpen } from "lucide-react";
import { DeveloperCollectionsClient } from "@/components/dashboard/DeveloperCollectionsClient";
import {
  getCollectionsForDeveloper,
  getCrmClientsForDeveloper,
  getLastViewedAtForCollections,
  getPublishedProjects,
  requireDeveloperProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperCollectionsPage() {
  const profile = await requireDeveloperProfile();
  const developerId = profile.developer_id;

  const [collections, clients, projectRows] = await Promise.all([
    getCollectionsForDeveloper(developerId),
    getCrmClientsForDeveloper(developerId),
    getPublishedProjects(developerId),
  ]);
  const lastViewedAt = await getLastViewedAtForCollections(collections.map((c) => c.id));

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <FolderOpen className="h-5 w-5 text-gold-400" /> Collections
        </h1>
        <p className="text-sm text-ink-400">Curate a shortlist of your projects and share it with a buyer via a link.</p>
      </div>
      <DeveloperCollectionsClient
        developerId={developerId}
        collections={collections}
        clients={clients}
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        lastViewedAt={lastViewedAt}
      />
    </div>
  );
}
