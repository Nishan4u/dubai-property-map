import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { BrokerPresentationWizard } from "@/components/broker/BrokerPresentationWizard";
import {
  getCrmClientsForBroker,
  getLatestPropertyRequestsForClients,
  getPublishedProjects,
  requireBrokerProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

// A new, parallel page -- src/app/broker/collections/page.tsx and
// BrokerCollectionsClient.tsx's existing single-step "New Collection"
// form are completely untouched. This is an additional, guided entry
// point into the exact same crm_collections/crm_collection_items data.
export default async function BrokerPresentationWizardPage() {
  const profile = await requireBrokerProfile();

  const [clients, projects] = await Promise.all([
    getCrmClientsForBroker(profile.broker_id),
    getPublishedProjects(),
  ]);
  const latestRequestByClient = await getLatestPropertyRequestsForClients(clients.map((c) => c.id));

  return (
    <div className="space-y-4 p-6">
      <Link href="/broker/collections" className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-300">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Collections
      </Link>
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Sparkles className="h-5 w-5 text-gold-400" /> Guided Presentation Wizard
        </h1>
        <p className="text-sm text-ink-400">
          Pick a client, choose matching projects and units, then create a shareable presentation.
        </p>
      </div>
      <BrokerPresentationWizard
        brokerId={profile.broker_id}
        clients={clients}
        projects={projects}
        latestRequestByClient={latestRequestByClient}
      />
    </div>
  );
}
