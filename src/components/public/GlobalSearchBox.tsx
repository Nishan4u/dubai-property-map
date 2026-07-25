"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

export interface SearchItem {
  type: "project" | "community" | "developer";
  id: string;
  name: string;
  href: string;
  subtitle?: string;
}

const typeLabel: Record<SearchItem["type"], string> = {
  project: "Project",
  community: "Community",
  developer: "Developer",
};

export function GlobalSearchBox({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 8);
  }, [items, query]);

  const showDropdown = focused && query.trim().length > 0;

  return (
    <div className="relative w-full min-w-0 lg:flex-1">
      <div className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          placeholder="Search projects, communities or developers..."
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQuery("")}
            className="shrink-0 text-ink-500 hover:text-ink-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-lg border border-navy-700 bg-navy-900 shadow-2xl">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-ink-500">
              No matches for &quot;{query}&quot;.
            </p>
          ) : (
            results.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.href}
                className="flex items-center justify-between gap-2 border-b border-navy-800 px-3 py-2.5 text-left last:border-b-0 hover:bg-navy-800"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-100">
                    {item.name}
                  </span>
                  {item.subtitle && (
                    <span className="block truncate text-xs text-ink-500">
                      {item.subtitle}
                    </span>
                  )}
                </span>
                <span className="shrink-0 rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-medium text-ink-400">
                  {typeLabel[item.type]}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
