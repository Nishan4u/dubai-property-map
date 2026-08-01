"use client";

import { useState } from "react";
import { Search, Trash2, X } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";

export function SearchableDataTable<T extends { id: string }>({
  columns,
  rows,
  searchPlaceholder,
  searchFields,
  selectable = false,
  onDeleteSelected,
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder: string;
  /** Returns the strings to match the query against for a given row. */
  searchFields: (row: T) => (string | null | undefined)[];
  /** Adds a checkbox column, a header "select all", and a bulk-delete bar. */
  selectable?: boolean;
  /** Called with the selected row ids once the caller's own confirm/guard
   * logic (message wording, FK-safety checks, audit logging) has approved
   * the delete -- kept out of this generic component since that logic
   * differs per entity type. */
  onDeleteSelected?: (ids: string[]) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((row) => searchFields(row).some((f) => f?.toLowerCase().includes(q)))
    : rows;

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected((prev) => {
      if (filtered.length > 0 && filtered.every((r) => prev.has(r.id))) return new Set();
      const next = new Set(prev);
      filtered.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (!onDeleteSelected || selected.size === 0) return;
    setDeleting(true);
    await onDeleteSelected(Array.from(selected));
    setSelected(new Set());
    setDeleting(false);
  }

  const displayColumns: Column<T>[] = selectable
    ? [
        {
          header: (
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              aria-label="Select all"
              className="accent-gold-500"
            />
          ),
          className: "w-8",
          render: (row) => (
            <input
              type="checkbox"
              checked={selected.has(row.id)}
              onChange={() => toggleOne(row.id)}
              aria-label="Select row"
              className="accent-gold-500"
            />
          ),
        },
        ...columns,
      ]
    : columns;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 sm:max-w-sm sm:flex-1">
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
        {selectable && selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
            <span className="text-xs font-medium text-rose-300">{selected.size} selected</span>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={deleting || !onDeleteSelected}
              className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting…" : "Delete Selected"}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs font-medium text-ink-400 hover:text-ink-200"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      {q && (
        <p className="text-xs text-ink-500">
          {filtered.length} of {rows.length} match{filtered.length === 1 ? "" : "es"} &quot;{query}&quot;
        </p>
      )}
      <DataTable columns={displayColumns} rows={filtered} />
    </div>
  );
}
