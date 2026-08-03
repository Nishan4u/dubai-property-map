"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const DEBOUNCE_MS = 800;

// Debounced, fire-and-forget search-query logging -- mirrors
// trackProjectEvent's (src/lib/trackEvent.ts) unawaited insert shape,
// just debounced since typing fires far more often than a single
// "search" is worth logging. Purely additive: callers pass their own
// already-computed query/result-count state, nothing about the
// existing filter/search logic changes.
export function useSearchTracking(query: string, source: string, resultCount: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const trimmed = query.trim();
    if (!trimmed) return;

    timeoutRef.current = setTimeout(() => {
      const supabase = createClient();
      supabase.from("search_log").insert({ query: trimmed, source, result_count: resultCount });
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, source, resultCount]);
}
