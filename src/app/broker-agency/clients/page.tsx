import { Contact } from "lucide-react";
import { AgencyClientsTable } from "@/components/broker-agency/AgencyClientsTable";
import { getCrmClientsForBrokerAgency, requireBrokerAgencyProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyClientsPage() {
  const profile = await requireBrokerAgencyProfile();
  const clients = await getCrmClientsForBrokerAgency(profile.broker_agency_id);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Contact className="h-5 w-5 text-gold-400" /> Clients
        </h1>
        <p className="text-sm text-ink-400">Track your agency&apos;s clients, notes, and follow-ups.</p>
      </div>
      <AgencyClientsTable brokerageId={profile.broker_agency_id} clients={clients} />
    </div>
  );
}
