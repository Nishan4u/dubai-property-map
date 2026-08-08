import Link from "next/link";
import { Plus } from "lucide-react";
import { BrokerListingsTable } from "@/components/broker/BrokerListingsTable";
import { getBrokerListingsForOwner, requireBrokerProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerListingsPage() {
  const profile = await requireBrokerProfile();
  const listings = await getBrokerListingsForOwner(profile.broker_id);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">My Listings</h1>
          <p className="text-sm text-ink-400">Your own Sale, Rent, and Lease property listings.</p>
        </div>
        <Link
          href="/broker/listings/new"
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> Add Listing
        </Link>
      </div>
      <BrokerListingsTable listings={listings} />
    </div>
  );
}
