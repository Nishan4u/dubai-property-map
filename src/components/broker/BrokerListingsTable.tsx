"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import type { BrokerListingRow } from "@/types/database";

const moderationTone = {
  pending: "gold",
  approved: "green",
  rejected: "red",
  archived: "neutral",
} as const;

export function BrokerListingsTable({ listings }: { listings: (BrokerListingRow & { communities: { name: string } | null })[] }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-8 text-center">
        <p className="text-sm text-ink-400">No listings yet.</p>
        <Link href="/broker/listings/new" className="mt-3 inline-block rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400">
          Add Your First Listing
        </Link>
      </div>
    );
  }

  return (
    <DataTable
      columns={[
        { header: "Title", render: (l) => <Link href={`/broker/listings/${l.id}`} className="font-medium text-ink-100 hover:text-gold-400">{l.title}</Link> },
        { header: "Type", render: (l) => <span className="capitalize">{l.listing_type}</span> },
        { header: "Community", render: (l) => l.communities?.name ?? "—" },
        { header: "Price", render: (l) => `AED ${l.price_aed.toLocaleString()}` },
        { header: "Status", render: (l) => <Badge tone="blue">{l.availability_status.replace("_", " ")}</Badge> },
        { header: "Review", render: (l) => <Badge tone={moderationTone[l.moderation_status]}>{l.moderation_status}</Badge> },
        { header: "Views", render: (l) => l.views },
        { header: "", render: (l) => <Link href={`/broker/listings/${l.id}`} className="text-xs font-medium text-gold-400 hover:text-gold-300">Edit</Link> },
      ]}
      rows={listings}
    />
  );
}
