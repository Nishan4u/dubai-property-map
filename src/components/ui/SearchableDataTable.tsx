"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";

export function SearchableDataTable<T extends { id: string }>({
  columns,
  rows,
  searchPlaceholder = "Search…",
  searchFn,
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder?: string;
  searchFn: (row: T, query: string) => boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => searchFn(row, q));
  }, [rows, query, searchFn]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
      </div>
      <DataTable columns={columns} rows={filtered} />
    </div>
  );
}
