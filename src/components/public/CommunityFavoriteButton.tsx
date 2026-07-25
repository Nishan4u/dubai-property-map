"use client";

import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useCommunityFavorites } from "@/components/auth/CommunityFavoritesProvider";

export function CommunityFavoriteButton({ communityId }: { communityId: string }) {
  const { favoriteCommunityIds, toggle } = useCommunityFavorites();
  const isFavorited = favoriteCommunityIds.has(communityId);

  return (
    <button
      onClick={() => toggle(communityId)}
      className={clsx(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium",
        isFavorited
          ? "border-rose-500/40 text-rose-400"
          : "border-navy-600 text-ink-300 hover:text-ink-100"
      )}
    >
      <Heart className={clsx("h-3.5 w-3.5", isFavorited && "fill-rose-500")} />
      {isFavorited ? "Saved" : "Save Community"}
    </button>
  );
}
