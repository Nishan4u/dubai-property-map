"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CommunityCard } from "@/components/public/CommunityCard";
import { useSearchTracking } from "@/lib/useSearchTracking";

interface CommunityWithStats {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pinColor: string;
  projectsCount: number;
  avgPrice: number;
  featured: boolean;
}

export function CommunitiesPageClient({
  communities,
}: {
  communities: CommunityWithStats[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
    );
  }, [communities, query]);

  useSearchTracking(query, "communities", filtered.length);

  return (
    <div>
      <div className="mt-6 flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search communities by name…"
          className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
      </div>

      <p className="mt-3 text-xs text-ink-500">
        {filtered.length} of {communities.length} communities
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CommunityCard
            key={c.id}
            id={c.id}
            slug={c.slug}
            name={c.name}
            description={c.description}
            pinColor={c.pinColor}
            projectsCount={c.projectsCount}
            avgPrice={c.avgPrice}
            featured={c.featured}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-ink-500">
            No communities match &quot;{query}&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
