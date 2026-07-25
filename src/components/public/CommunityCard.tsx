"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useCommunityFavorites } from "@/components/auth/CommunityFavoritesProvider";
import { formatAed } from "@/data/mock";

export function CommunityCard({
  id,
  slug,
  name,
  description,
  pinColor,
  projectsCount,
  avgPrice,
}: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pinColor: string;
  projectsCount: number;
  avgPrice: number;
}) {
  const { favoriteCommunityIds, toggle } = useCommunityFavorites();
  const isFavorited = favoriteCommunityIds.has(id);

  return (
    <Link
      href={`/communities/${slug}`}
      className="relative rounded-xl border border-navy-700 bg-navy-850 p-5 transition-colors hover:border-gold-500/40"
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          toggle(id);
        }}
        className="absolute right-4 top-4 text-ink-500 hover:text-rose-400"
      >
        <Heart className={clsx("h-4 w-4", isFavorited && "fill-rose-500 text-rose-500")} />
      </button>
      <div className="flex items-center gap-2 pr-6">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: pinColor }} />
        <h3 className="text-sm font-semibold text-ink-100">{name}</h3>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-ink-400">{description}</p>
      <div className="mt-3 text-xs text-ink-500">
        {projectsCount} Projects
        {avgPrice > 0 ? ` · Avg ${formatAed(avgPrice)}` : ""}
      </div>
    </Link>
  );
}
