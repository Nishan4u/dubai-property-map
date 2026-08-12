import { BrokerListingCard } from "@/components/public/BrokerListingCard";
import type { BrokerListingRow, CommunityRow } from "@/types/database";

interface TeammateListing extends BrokerListingRow {
  communities: Pick<CommunityRow, "name" | "slug"> | null;
  brokers: {
    full_name: string;
    photo_url: string | null;
    slug: string;
    brokerages: { name: string } | null;
  } | null;
}

// Renders team-tier listings from OTHER brokers in the same agency,
// via the existing, unmodified BrokerListingCard (src/components/public/
// BrokerListingCard.tsx) -- it already accepts brokerName/brokerPhotoUrl/
// brokerageName props built for exactly this "whose listing is this"
// need, so this component only supplies the teammate's info from the
// joined `brokers` row; no changes to the shared card itself.
export function TeamListingsClient({ listings }: { listings: TeammateListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-8 text-center">
        <p className="text-sm text-ink-400">No team listings yet.</p>
        <p className="mt-1 text-xs text-ink-500">
          When a colleague in your agency marks a listing as Team, it&apos;ll show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <BrokerListingCard
          key={l.id}
          listing={l}
          brokerName={l.brokers?.full_name ?? "Team member"}
          brokerPhotoUrl={l.brokers?.photo_url}
          brokerageName={l.brokers?.brokerages?.name}
        />
      ))}
    </div>
  );
}
