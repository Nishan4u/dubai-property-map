"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import type { BrokerListingRow } from "@/types/database";

const moderationTone = {
  pending: "gold",
  approved: "green",
  rejected: "red",
  archived: "neutral",
} as const;

// visibility (patch_142) badge tones -- "private"/"team" read as
// restrained (neutral/blue), "presentation" as an active call-to-share
// (gold, matching the moderation "pending" gold), "public" as the
// settled/live state (green, matching moderation "approved").
const visibilityTone = {
  private: "neutral",
  team: "blue",
  presentation: "gold",
  public: "green",
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
        {
          header: "Visibility",
          render: (l) => {
            // Pre-migration rows won't have a visibility value yet --
            // never crash the table, just fall back to the same
            // "public" default the DB column itself uses.
            const v = l.visibility ?? "public";
            return <Badge tone={visibilityTone[v]}>{v}</Badge>;
          },
        },
        { header: "Views", render: (l) => l.views },
        {
          header: "",
          render: (l) => (
            <div className="flex items-center gap-3">
              {l.visibility === "presentation" && (
                // Hardcoded domain, not window.location.origin -- this
                // row renders unconditionally on initial mount (unlike
                // BrokerCollectionsClient's WhatsApp link, which only
                // renders after a client-side "Share" click), so it's
                // part of this "use client" component's server-rendered
                // HTML too. window is undefined during that SSR pass.
                // Matches the existing hardcoded-domain convention used
                // in this codebase's JSON-LD (e.g. src/app/page.tsx:45).
                <a
                  href={getWhatsAppUrl("", `${l.title}: https://dubaipropertymap.ae/brokers/listings/${l.slug}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-ink-300 hover:text-ink-100"
                  title="Share via WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              )}
              <Link href={`/broker/listings/${l.id}`} className="text-xs font-medium text-gold-400 hover:text-gold-300">
                Edit
              </Link>
            </div>
          ),
        },
      ]}
      rows={listings}
    />
  );
}
