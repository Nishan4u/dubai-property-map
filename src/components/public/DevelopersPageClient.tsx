"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Search, Star } from "lucide-react";

interface DeveloperWithCount {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  color: string;
  initial: string;
  verified: boolean;
  founded: number | null;
  projectsCount: number;
  featured: boolean;
}

export function DevelopersPageClient({
  developers,
}: {
  developers: DeveloperWithCount[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return developers;
    return developers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q)
    );
  }, [developers, query]);

  return (
    <div>
      <div className="mt-6 flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search developers by name…"
          className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
      </div>

      <p className="mt-3 text-xs text-ink-500">
        {filtered.length} of {developers.length} developers
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((dev) => (
          <Link
            key={dev.id}
            href={`/developers/${dev.slug}`}
            // Same reasoning as ProjectCard -- rendered in grids of a
            // dozen+ above the fold, so prefetch={false} avoids a full
            // server-rendered fetch per card per page load.
            prefetch={false}
            className={`relative rounded-xl border p-5 transition-colors hover:border-gold-500/40 ${
              dev.featured ? "border-gold-500/50 bg-gold-500/[0.03]" : "border-navy-700 bg-navy-850"
            }`}
          >
            {dev.featured && (
              <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-gold-400">
                <Star className="h-3 w-3 fill-gold-400" /> Featured
              </span>
            )}
            <div className="flex items-center gap-3">
              {dev.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dev.logoUrl}
                  alt={dev.name}
                  className="h-12 w-12 shrink-0 rounded-xl border border-navy-700 bg-navy-900 object-contain p-1.5"
                />
              ) : (
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                  style={{ background: dev.color }}
                >
                  {dev.initial}
                </div>
              )}
              <div>
                <p className="flex items-center gap-1 text-sm font-semibold text-ink-100">
                  {dev.name}
                  {dev.verified && (
                    <BadgeCheck className="h-4 w-4 text-sky-400" />
                  )}
                </p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-ink-400">
              {dev.description}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
              <span>{dev.projectsCount} Projects</span>
              <span>{dev.founded ? `Since ${dev.founded}` : ""}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-ink-500">
            No developers match &quot;{query}&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
