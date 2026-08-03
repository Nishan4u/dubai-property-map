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
  featured = false,
}: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pinColor: string;
  projectsCount: number;
  avgPrice: number;
  featured?: boolean;
}) {
  const { favoriteCommunityIds, toggle } = useCommunityFavorites();
  const isFavorited = favoriteCommunityIds.has(id);

  return (
    <Link
      href={`/communities/${slug}`}
      className={clsx(
        "relative rounded-xl border p-5 transition-colors hover:border-gold-500/40",
        featured ? "border-gold-500/50 bg-gold-500/[0.03]" : "border-navy-700 bg-navy-850"
      )}
    >
      {featured && (
        <span className="absolute left-4 top-4 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-gold-400">
          Sponsored
        </span>
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggle(id);
        }}
        className="absolute right-4 top-4 text-ink-500 hover:text-rose-400"
      >
        <Heart className={clsx("h-4 w-4", isFavorited && "fill-rose-500 text-rose-500")} />
      </button>
      <div className={clsx("flex items-center gap-2 pr-6", featured && "mt-5")}>
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
