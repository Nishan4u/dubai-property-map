import { ClipboardList } from "lucide-react";
import { BrokerRequestsTable } from "@/components/broker/BrokerRequestsTable";
import { getPropertyRequestsForBroker, getCrmClientsForBroker, requireBrokerProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerRequestsPage() {
  const profile = await requireBrokerProfile();
  const [requests, clients] = await Promise.all([
    getPropertyRequestsForBroker(profile.broker_id),
    getCrmClientsForBroker(profile.broker_id),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <ClipboardList className="h-5 w-5 text-gold-400" /> My Requests
        </h1>
        <p className="text-sm text-ink-400">Property requests you&apos;ve submitted, and their status through the pipeline.</p>
      </div>
      <BrokerRequestsTable requests={requests} clients={clients} />
    </div>
  );
}
