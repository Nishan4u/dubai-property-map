"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { ProjectCard } from "@/components/public/ProjectCard";
import { FavoritesRecommendations } from "@/components/public/FavoritesRecommendations";
import { useFavorites } from "@/components/auth/FavoritesProvider";
import { createClient } from "@/lib/supabase/client";
import { mapProject } from "@/lib/supabase/mappers";
import type { Project } from "@/types";
import type { ProjectWithRelations } from "@/types/database";

export function FavoritesPageClient() {
  const { userId, loaded, favoriteIds } = useFavorites();
  const [projects, setProjects] = useState<Project[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loaded) return;
    if (favoriteIds.size === 0) {
      setProjects([]);
      setFetching(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("projects")
      .select("*, developers(*), communities(*)")
      .in("id", Array.from(favoriteIds))
      .then(({ data }) => {
        setProjects(((data ?? []) as ProjectWithRelations[]).map(mapProject));
        setFetching(false);
      });
  }, [loaded, favoriteIds]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-100">
        <Heart className="h-6 w-6 text-rose-400" /> Your Favorites
      </h1>

      {loaded && !userId ? (
        <p className="mt-4 text-sm text-ink-400">
          <Link href="/login" className="text-gold-400 hover:underline">
            Log in
          </Link>{" "}
          to save and view your favorite projects.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-400">
            Projects you&apos;ve saved with the heart icon.
          </p>
          <div className="mt-6 space-y-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
            {!fetching && projects.length === 0 && (
              <p className="text-sm text-ink-500">
                No favorites yet — tap the heart icon on any project to save
                it here.
              </p>
            )}
          </div>
          {!fetching && projects.length > 0 && <FavoritesRecommendations />}
        </>
      )}
    </div>
  );
}
