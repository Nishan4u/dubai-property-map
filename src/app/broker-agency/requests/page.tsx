import { ClipboardList } from "lucide-react";
import { AgencyRequestsTable } from "@/components/broker-agency/AgencyRequestsTable";
import { getPropertyRequestsForBrokerAgency, requireBrokerAgencyProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyRequestsPage() {
  const profile = await requireBrokerAgencyProfile();
  const requests = await getPropertyRequestsForBrokerAgency(profile.broker_agency_id);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <ClipboardList className="h-5 w-5 text-gold-400" /> My Requests
        </h1>
        <p className="text-sm text-ink-400">Property requests your agency has submitted, and their status through the pipeline.</p>
      </div>
      <AgencyRequestsTable requests={requests} />
    </div>
  );
}
