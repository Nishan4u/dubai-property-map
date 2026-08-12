import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import type { DbBrokerListingVisibility } from "@/types/database";

// visibility (patch_142) badge tones -- same convention as
// BrokerListingsTable.tsx/BrokerListingsModerationTable.tsx. 'private'
// is deliberately absent from this map: RLS ("broker_listings: agency
// reads own agency's", patch_143) means a private-tier row can never
// reach this component at all -- not just filtered out, genuinely
// inaccessible to this query.
const visibilityTone: Record<Exclude<DbBrokerListingVisibility, "private">, "green" | "gold" | "blue"> = {
  team: "blue",
  presentation: "gold",
  public: "green",
};

interface AgencyListing {
  id: string;
  title: string;
  listing_type: string;
  price_aed: number;
  visibility: DbBrokerListingVisibility;
  created_at: string;
  communities: { name: string } | null;
  brokers: { id: string; full_name: string } | null;
}

// Read-only -- the agency doesn't own these rows (they belong to the
// individual broker), so unlike AgencyClientsTable.tsx there's no
// create/edit/delete here, only oversight. Mounted both on the agency-
// wide /broker-agency/listings page (every broker) and inline on a
// single broker's /broker-agency/brokers/[id] detail page (that
// broker's listings only) -- the redundant "Broker" column on the
// latter is harmless, not worth a second variant of this table.
export function AgencyListingsTable({ listings }: { listings: AgencyListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-8 text-center">
        <p className="text-sm text-ink-400">No listings to show.</p>
        <p className="mt-1 text-xs text-ink-500">
          Private-tier listings never appear here -- only Team, Presentation, and Public.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      columns={[
        {
          header: "Broker",
          render: (l) =>
            l.brokers ? (
              <Link href={`/broker-agency/brokers/${l.brokers.id}`} className="font-medium text-ink-100 hover:text-gold-400">
                {l.brokers.full_name}
              </Link>
            ) : (
              "—"
            ),
        },
        { header: "Title", render: (l) => l.title },
        { header: "Type", render: (l) => <span className="capitalize">{l.listing_type}</span> },
        { header: "Community", render: (l) => l.communities?.name ?? "—" },
        { header: "Price", render: (l) => `AED ${l.price_aed.toLocaleString()}` },
        { header: "Visibility", render: (l) => <Badge tone={visibilityTone[l.visibility as Exclude<DbBrokerListingVisibility, "private">]}>{l.visibility}</Badge> },
        { header: "Listed", render: (l) => new Date(l.created_at).toLocaleDateString() },
      ]}
      rows={listings}
    />
  );
}
