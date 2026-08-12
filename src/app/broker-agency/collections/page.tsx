import { FolderOpen } from "lucide-react";
import { AgencyCollectionsClient } from "@/components/broker-agency/AgencyCollectionsClient";
import {
  getCollectionsForBrokerAgency,
  getCrmClientsForBrokerAgency,
  getLastViewedAtForCollections,
  getPublishedProjects,
  requireBrokerAgencyProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyCollectionsPage() {
  const profile = await requireBrokerAgencyProfile();

  const [collections, clients, projectRows] = await Promise.all([
    getCollectionsForBrokerAgency(profile.broker_agency_id),
    getCrmClientsForBrokerAgency(profile.broker_agency_id),
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
      <AgencyCollectionsClient
        brokerageId={profile.broker_agency_id}
        collections={collections}
        clients={clients}
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        lastViewedAt={lastViewedAt}
      />
    </div>
  );
}
