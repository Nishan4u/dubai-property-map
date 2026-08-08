import { BrokerListingsModerationTable } from "@/components/admin/BrokerListingsModerationTable";
import { getAllBrokerListingsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminBrokerListingsPage() {
  const listings = await getAllBrokerListingsAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Broker Listings</h1>
        <p className="text-sm text-ink-400">{listings.length} property listings across all brokers.</p>
      </div>
      <BrokerListingsModerationTable listings={listings} />
    </div>
  );
}
