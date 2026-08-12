import { Home } from "lucide-react";
import { AgencyListingsTable } from "@/components/broker-agency/AgencyListingsTable";
import { getBrokerListingsForAgency, requireBrokerAgencyProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyListingsPage() {
  await requireBrokerAgencyProfile();
  const listings = await getBrokerListingsForAgency();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Home className="h-5 w-5 text-gold-400" /> Listings
        </h1>
        <p className="text-sm text-ink-400">
          Team, Presentation, and Public listings from every broker in your agency. Private listings stay visible
          only to the broker who owns them.
        </p>
      </div>
      <AgencyListingsTable listings={listings} />
    </div>
  );
}
