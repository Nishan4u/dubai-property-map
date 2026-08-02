import { Users } from "lucide-react";
import { BrokerClientsTable } from "@/components/broker/BrokerClientsTable";
import { getCrmClientsForBroker, requireBrokerProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerClientsPage() {
  const profile = await requireBrokerProfile();
  const clients = await getCrmClientsForBroker(profile.broker_id);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Users className="h-5 w-5 text-gold-400" /> Clients
        </h1>
        <p className="text-sm text-ink-400">Track your own clients, notes, and follow-ups.</p>
      </div>
      <BrokerClientsTable brokerId={profile.broker_id} clients={clients} />
    </div>
  );
}
