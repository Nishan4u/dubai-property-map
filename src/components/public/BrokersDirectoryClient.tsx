"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import { BrokerCard } from "@/components/public/BrokerCard";
import { CompactSelect } from "@/components/public/CompactSelect";
import type { BrokerDirectoryRow } from "@/lib/supabase/queries";
import type { CommunityRow } from "@/types/database";

type SortKey = "featured" | "verified" | "most_listings" | "most_projects" | "most_viewed" | "recent" | "alphabetical";

const sortOptions: { label: string; value: SortKey }[] = [
  { label: "Featured", value: "featured" },
  { label: "Verified First", value: "verified" },
  { label: "Most Listings", value: "most_listings" },
  { label: "Most Developer Projects", value: "most_projects" },
  { label: "Most Viewed", value: "most_viewed" },
  { label: "Recently Joined", value: "recent" },
  { label: "Alphabetical", value: "alphabetical" },
];

const propertyTypeOptions = ["Apartments", "Villas", "Townhouses", "Penthouse", "Office", "Retail", "Warehouse"];
const languageOptions = ["English", "Arabic", "Hindi", "Urdu", "Russian", "French", "Chinese", "Tagalog"];

export function BrokersDirectoryClient({ brokers, communities }: { brokers: BrokerDirectoryRow[]; communities: CommunityRow[] }) {
  const [query, setQuery] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingTypeFilters, setListingTypeFilters] = useState<Set<"sale" | "rent" | "lease">>(new Set());
  const [language, setLanguage] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");
  // Collapsed by default below lg (matches AllProjectsClient.tsx's
  // FilterSidebar toggle) -- on mobile the Community/Property Type/
  // Language/Verified/listing-type block is a wall of controls before any
  // broker card is visible. Always shown at lg and up (unchanged desktop
  // behavior).
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    (communityId ? 1 : 0) +
    (propertyType ? 1 : 0) +
    (language ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    listingTypeFilters.size;

  function toggleListingType(t: "sale" | "rent" | "lease") {
    setListingTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brokers.filter((b) => {
      if (q && !b.full_name.toLowerCase().includes(q) && !(b.brokerage_name ?? "").toLowerCase().includes(q)) return false;
      if (communityId && !b.listingCommunityIds.includes(communityId)) return false;
      if (propertyType && !b.listingPropertyTypes.includes(propertyType)) return false;
      if (listingTypeFilters.size > 0 && ![...listingTypeFilters].some((t) => b.listingTypes.includes(t))) return false;
      if (language && !b.languages.includes(language)) return false;
      if (verifiedOnly && b.verification_status !== "active") return false;
      return true;
    });
  }, [brokers, query, communityId, propertyType, listingTypeFilters, language, verifiedOnly]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "featured":
        return arr.sort((a, b) => Number(b.featured) - Number(a.featured));
      case "verified":
        return arr.sort((a, b) => Number(b.verification_status === "active") - Number(a.verification_status === "active"));
      case "most_listings":
        return arr.sort((a, b) => b.listings_count - a.listings_count);
      case "most_projects":
        return arr.sort((a, b) => b.projects_count - a.projects_count);
      case "most_viewed":
        return arr.sort((a, b) => b.profile_views - a.profile_views);
      case "recent":
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "alphabetical":
        return arr.sort((a, b) => a.full_name.localeCompare(b.full_name));
      default:
        return arr;
    }
  }, [filtered, sort]);

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brokers by name or agency…"
            className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-56">
          <CompactSelect label="Sort" hideLabel placeholder="Sort" value={sort} onChange={(v) => setSort(v as SortKey)} options={sortOptions} allowClear={false} />
        </div>
      </div>

      <button
        onClick={() => setShowFilters((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-navy-700 bg-navy-850 px-4 py-2.5 text-sm font-medium text-ink-200 lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gold-400" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-semibold text-navy-950">
              {activeFilterCount}
            </span>
          )}
        </span>
        <ChevronDown className={clsx("h-4 w-4 shrink-0 transition-transform", showFilters && "rotate-180")} />
      </button>

      <div className={clsx(showFilters ? "block" : "hidden", "lg:block")}>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <CompactSelect
            label="Community"
            placeholder="Any Community"
            value={communityId}
            onChange={setCommunityId}
            options={communities.map((c) => ({ label: c.name, value: c.id }))}
          />
          <CompactSelect
            label="Property Type"
            placeholder="Any Type"
            value={propertyType}
            onChange={setPropertyType}
            options={propertyTypeOptions.map((v) => ({ label: v, value: v }))}
          />
          <CompactSelect label="Language" placeholder="Any Language" value={language} onChange={setLanguage} options={languageOptions.map((l) => ({ label: l, value: l }))} />
          <label className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2.5 text-xs text-ink-300">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="accent-gold-500" />
            Verified Brokers Only
          </label>
        </div>

        <div className="mt-3 flex gap-4 text-xs text-ink-300">
          {(["sale", "rent", "lease"] as const).map((t) => (
            <label key={t} className="flex items-center gap-1.5 capitalize">
              <input type="checkbox" checked={listingTypeFilters.has(t)} onChange={() => toggleListingType(t)} className="accent-gold-500" />
              {t}
            </label>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        {sorted.length} of {brokers.length} brokers
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((b) => (
          <BrokerCard key={b.id} broker={b} />
        ))}
        {sorted.length === 0 && <p className="col-span-full text-sm text-ink-500">No brokers match your filters.</p>}
      </div>
    </div>
  );
}
