"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface QuickSearchItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra words that should also match this item beyond its own label
   * (e.g. "leads" for the "Property Requests" page) -- keeps the search
   * useful for however an admin thinks of a given function, not just its
   * exact nav label. */
  keywords?: string[];
}

// A Cmd/Ctrl+K command palette over every admin nav item this account can
// see -- "admin can search all functions" from the admin's own request.
// Scoped to the admin's top-level functions (the 30+ items in
// AdminShellClient's navItems, already filtered by hasModuleAccess for a
// restricted admin) rather than indexing every sub-page/tab, which would
// need a much larger, hand-maintained index for comparatively little
// day-to-day benefit over just clicking the sidebar once you're on the
// right page.
export function AdminQuickSearch({ items }: { items: QuickSearchItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      return item.keywords?.some((k) => k.toLowerCase().includes(q));
    });
  }, [items, query]);

  // Global Cmd/Ctrl+K to open from anywhere in the admin shell, Esc to close.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function openPalette() {
    setQuery("");
    setHighlighted(0);
    setOpen(true);
  }

  function go(item: QuickSearchItem) {
    setOpen(false);
    router.push(item.href);
  }

  return (
    <>
      <button
        onClick={openPalette}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-navy-700 bg-navy-850 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-100"
        aria-label="Search admin functions"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden rounded border border-navy-600 px-1.5 py-0.5 text-[10px] text-ink-500 sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 px-4 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-navy-700 bg-navy-900 shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-navy-700 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-ink-500" />
              <input
                ref={(el) => {
                  inputRef.current = el;
                  // Autofocus on mount (the input only exists once the
                  // palette is open) -- a ref callback runs synchronously
                  // right after the DOM node is attached, so this needs no
                  // effect/setState round-trip.
                  el?.focus();
                }}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlighted((i) => Math.min(i + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlighted((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && results[highlighted]) {
                    go(results[highlighted]);
                  }
                }}
                placeholder="Search admin functions… (Developers, Payments, Ads, Reports…)"
                className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              <kbd className="shrink-0 rounded border border-navy-600 px-1.5 py-0.5 text-[10px] text-ink-500">
                Esc
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-500">No matching admin function.</p>
              ) : (
                results.map((item, i) => (
                  <button
                    key={item.href}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      i === highlighted
                        ? "bg-gold-500 text-navy-950"
                        : "text-ink-200 hover:bg-navy-800"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
