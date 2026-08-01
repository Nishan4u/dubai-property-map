"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";

export function SearchableDataTable<T extends { id: string }>({
  columns,
  rows,
  searchPlaceholder,
  searchFields,
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder: string;
  /** Returns the strings to match the query against for a given row. */
  searchFields: (row: T) => (string | null | undefined)[];
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((row) => searchFields(row).some((f) => f?.toLowerCase().includes(q)))
    : rows;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 sm:max-w-sm">
        <Search className="h-4 w-4 shrink-0 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          placeholder={searchPlaceholder}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="shrink-0 text-ink-500 hover:text-ink-200"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {q && (
        <p className="text-xs text-ink-500">
          {filtered.length} of {rows.length} match{filtered.length === 1 ? "" : "es"} &quot;{query}&quot;
        </p>
      )}
      <DataTable columns={columns} rows={filtered} />
    </div>
  );
}
