import { FolderOpen } from "lucide-react";
import { BrokerCollectionsClient } from "@/components/broker/BrokerCollectionsClient";
import {
  getCollectionsForBroker,
  getCrmClientsForBroker,
  getLastViewedAtForCollections,
  getPublishedProjects,
  requireBrokerProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerCollectionsPage() {
  const profile = await requireBrokerProfile();

  const [collections, clients, projectRows] = await Promise.all([
    getCollectionsForBroker(profile.broker_id),
    getCrmClientsForBroker(profile.broker_id),
    getPublishedProjects(),
  ]);
  const lastViewedAt = await getLastViewedAtForCollections(collections.map((c) => c.id));

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <FolderOpen className="h-5 w-5 text-gold-400" /> Collections
        </h1>
        <p className="text-sm text-ink-400">Curate a shortlist of projects and share it with a client via a link.</p>
      </div>
      <BrokerCollectionsClient
        brokerId={profile.broker_id}
        collections={collections}
        clients={clients}
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        lastViewedAt={lastViewedAt}
      />
    </div>
  );
}
