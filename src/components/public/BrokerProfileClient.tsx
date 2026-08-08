"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { BrokerContactPanel } from "@/components/public/BrokerContactPanel";
import { BrokerListingCard } from "@/components/public/BrokerListingCard";
import { BrokerProjectCard } from "@/components/public/BrokerProjectCard";
import type { BrokerPublicProfileRow } from "@/types/database";
import type { ProjectPreview } from "@/lib/supabase/queries";

interface ListingWithCommunity {
  id: string;
  slug: string;
  title: string;
  property_type: string;
  listing_type: "sale" | "rent" | "lease";
  price_aed: number;
  communities: { name: string } | null;
}

type Tab = "about" | "listings" | "projects" | "contact";

export function BrokerProfileClient({
  broker,
  listings,
  linkedProjects,
}: {
  broker: BrokerPublicProfileRow;
  listings: ListingWithCommunity[];
  linkedProjects: { linkId: string; project: ProjectPreview | null }[];
}) {
  const [tab, setTab] = useState<Tab>("about");
  const isVerified = broker.verification_status === "active";

  const tabs: { key: Tab; label: string }[] = [
    { key: "about", label: "About" },
    { key: "listings", label: `Property Listings (${listings.length})` },
    { key: "projects", label: `Developer Projects (${linkedProjects.length})` },
    { key: "contact", label: "Contact" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
        {broker.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={broker.photo_url} alt={broker.full_name} className="h-20 w-20 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gold-500 text-2xl font-semibold text-navy-950">
            {broker.full_name.charAt(0)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
            {broker.full_name}
            {isVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-sky-400" />}
          </h1>
          <p className="mt-0.5 text-sm text-ink-400">{broker.brokerage_name ?? "Independent Broker"}</p>
          {broker.experience_years != null && (
            <p className="mt-1 text-xs text-ink-500">{broker.experience_years}+ years experience</p>
          )}
          {broker.languages.length > 0 && (
            <p className="mt-1 text-xs text-ink-500">Speaks {broker.languages.join(", ")}</p>
          )}
        </div>
        <div className="flex gap-6 text-center">
          <Stat label="Listings" value={listings.length} />
          <Stat label="Projects" value={linkedProjects.length} />
          <Stat label="Profile Views" value={broker.profile_views} />
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-navy-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === t.key ? "border-gold-500 text-gold-400" : "border-transparent text-ink-400 hover:text-ink-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "about" && (
          <div className="max-w-2xl space-y-4">
            {broker.bio ? (
              <p className="text-sm leading-relaxed text-ink-300">{broker.bio}</p>
            ) : (
              <p className="text-sm text-ink-500">{broker.full_name} hasn&apos;t added a biography yet.</p>
            )}
            {broker.brn && (
              <p className="text-xs text-ink-500">RERA Number (BRN): {broker.brn}</p>
            )}
          </div>
        )}

        {tab === "listings" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.length === 0 && <p className="text-sm text-ink-500">No property listings yet.</p>}
            {listings.map((l) => (
              <BrokerListingCard key={l.id} listing={l} brokerName={broker.full_name} brokerPhotoUrl={broker.photo_url} brokerageName={broker.brokerage_name} />
            ))}
          </div>
        )}

        {tab === "projects" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {linkedProjects.length === 0 && <p className="text-sm text-ink-500">No developer projects added yet.</p>}
            {linkedProjects.map((l) =>
              l.project ? (
                <BrokerProjectCard key={l.linkId} brokerId={broker.id} project={l.project} brokerName={broker.full_name} brokerPhotoUrl={broker.photo_url} brokerageName={broker.brokerage_name} />
              ) : null
            )}
          </div>
        )}

        {tab === "contact" && (
          <div className="max-w-sm">
            <BrokerContactPanel slug={broker.slug} brokerName={broker.full_name} />
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-bold text-ink-100">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
