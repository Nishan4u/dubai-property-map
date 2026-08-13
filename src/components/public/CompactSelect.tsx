"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { clsx } from "clsx";

export function CompactSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  searchable = true,
  hideLabel = false,
  allowClear = true,
  disabled = false,
  className,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string; group?: string }[];
  searchable?: boolean;
  /** Skip rendering the label above the trigger -- for inline controls
   * (e.g. a "Sort by" dropdown next to a search bar) where the surrounding
   * layout already makes the field's purpose clear. */
  hideLabel?: boolean;
  /** Set false for fields that always hold a value (e.g. Sort, or picking
   * which project fills a Compare slot) -- hides the "clear selection"
   * entry, which would otherwise be a dead option since there's nothing
   * meaningful to clear to. */
  allowClear?: boolean;
  /** Disables the trigger -- for save-in-flight states or fields that
   * cascade from another not-yet-chosen field. */
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  function handleSelect(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      {!hideLabel && (
        <label className="mb-1 block text-xs font-medium text-ink-400">{label}</label>
      )}
      <button
        type="button"
        title={hideLabel ? label : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-left text-xs text-ink-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={clsx("truncate", !value && "text-ink-500")}>{selectedLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-500" />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-hidden rounded-lg border border-navy-600 bg-navy-900 shadow-2xl">
          {searchable && options.length > 6 && (
            <div className="flex items-center gap-1.5 border-b border-navy-700 px-2.5 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-ink-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto py-1">
            {allowClear && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={clsx(
                  "block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-navy-800",
                  !value ? "text-gold-400" : "text-ink-300"
                )}
              >
                {placeholder}
              </button>
            )}
            {filtered.map((o, i) => (
              <div key={o.value}>
                {o.group && o.group !== filtered[i - 1]?.group && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                    {o.group}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={clsx(
                    "block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-navy-800",
                    value === o.value ? "text-gold-400" : "text-ink-300"
                  )}
                >
                  {o.label}
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-ink-500">No matches.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
