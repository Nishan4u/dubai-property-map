import { TeamListingsClient } from "@/components/broker/TeamListingsClient";
import { getTeamListings, requireBrokerProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerTeamListingsPage() {
  const profile = await requireBrokerProfile();
  const listings = await getTeamListings(profile.broker_id);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Team Listings</h1>
        <p className="text-sm text-ink-400">
          Listings colleagues in your agency have marked as Team-visible.
        </p>
      </div>
      <TeamListingsClient listings={listings} />
    </div>
  );
}
