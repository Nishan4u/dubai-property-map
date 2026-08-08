"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { BrokerListingModerationActions } from "@/components/admin/BrokerListingModerationActions";
import type { DbBrokerListingModeration } from "@/types/database";

const tone: Record<DbBrokerListingModeration, "green" | "gold" | "red" | "neutral"> = {
  pending: "gold",
  approved: "green",
  rejected: "red",
  archived: "neutral",
};

interface Row {
  id: string;
  title: string;
  listing_type: string;
  price_aed: number;
  moderation_status: DbBrokerListingModeration;
  created_at: string;
  brokers: { id: string; full_name: string } | null;
  communities: { name: string } | null;
}

export function BrokerListingsModerationTable({ listings }: { listings: Row[] }) {
  return (
    <DataTable
      columns={[
        { header: "Title", render: (l) => l.title },
        {
          header: "Broker",
          render: (l) =>
            l.brokers ? (
              <Link href={`/admin/brokers/${l.brokers.id}`} className="text-gold-400 hover:underline">
                {l.brokers.full_name}
              </Link>
            ) : (
              "—"
            ),
        },
        { header: "Community", render: (l) => l.communities?.name ?? "—" },
        { header: "Type", render: (l) => <span className="capitalize">{l.listing_type}</span> },
        { header: "Price", render: (l) => `AED ${l.price_aed.toLocaleString()}` },
        { header: "Status", render: (l) => <Badge tone={tone[l.moderation_status]}>{l.moderation_status}</Badge> },
        { header: "Submitted", render: (l) => new Date(l.created_at).toLocaleDateString() },
        { header: "Actions", render: (l) => <BrokerListingModerationActions listingId={l.id} /> },
      ]}
      rows={listings}
    />
  );
}
