"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { AssistantProjectResult } from "@/lib/supabase/queries";

function formatPrice(aed: number): string {
  if (aed >= 1_000_000) return `AED ${(aed / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (aed >= 1_000) return `AED ${Math.round(aed / 1_000)}K`;
  return `AED ${aed}`;
}

// Only rendered by FavoritesPageClient once the user actually has favorites
// -- with none, there's nothing real to base a recommendation on.
export function FavoritesRecommendations() {
  const [blurb, setBlurb] = useState("");
  const [projects, setProjects] = useState<AssistantProjectResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/assistant/recommendations")
      .then((res) => res.json())
      .then((data: { blurb?: string; projects?: AssistantProjectResult[] }) => {
        if (cancelled) return;
        setBlurb(data.blurb ?? "");
        setProjects(data.projects ?? []);
      })
      .catch(() => {
        if (!cancelled) setBlurb("Couldn't load recommendations right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-navy-700 bg-navy-850 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold-400">
          <Sparkles className="h-3.5 w-3.5" /> AI Recommendations
        </p>
        <p className="mt-2 text-sm text-ink-500">Finding matches based on your favorites…</p>
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <div className="mt-8 rounded-xl border border-navy-700 bg-navy-850 p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold-400">
        <Sparkles className="h-3.5 w-3.5" /> AI Recommendations
      </p>
      {blurb && <p className="mt-2 text-sm text-ink-200">{blurb}</p>}
      <div className="mt-3 space-y-2">
        {projects.map((p) => (
          <Link
            key={p.path}
            href={p.path}
            className="block rounded-lg border border-navy-700 bg-navy-900 p-2.5 text-xs hover:border-gold-500/60"
          >
            <p className="font-semibold text-ink-100">{p.name}</p>
            <p className="mt-0.5 text-ink-400">
              {p.communityName} · {p.developerName} · {formatPrice(p.priceFromAed)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
