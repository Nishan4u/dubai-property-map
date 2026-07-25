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
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  searchable?: boolean;
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
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-ink-400">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-left text-xs text-ink-300 focus:outline-none"
      >
        <span className={clsx("truncate", !value && "text-ink-500")}>{selectedLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-500" />
      </button>

      {open && (
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
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className={clsx(
                  "block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-navy-800",
                  value === o.value ? "text-gold-400" : "text-ink-300"
                )}
              >
                {o.label}
              </button>
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
