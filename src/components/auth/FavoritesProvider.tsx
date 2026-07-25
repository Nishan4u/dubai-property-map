"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FavoritesContextValue {
  userId: string | null;
  loaded: boolean;
  favoriteIds: Set<string>;
  toggle: (projectId: string) => Promise<"added" | "removed" | "needs-login">;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setFavoriteIds(new Set());
        setLoaded(true);
        return;
      }

      setUserId(user.id);
      const { data } = await supabase
        .from("favorites")
        .select("project_id")
        .eq("user_id", user.id);

      setFavoriteIds(new Set((data ?? []).map((f) => f.project_id)));
      setLoaded(true);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());

    return () => subscription.unsubscribe();
  }, []);

  async function toggle(projectId: string) {
    if (!userId) return "needs-login" as const;

    const supabase = createClient();
    const isFavorited = favoriteIds.has(projectId);

    if (isFavorited) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("project_id", projectId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
      return "removed" as const;
    }

    await supabase.from("favorites").insert({ user_id: userId, project_id: projectId });
    setFavoriteIds((prev) => new Set(prev).add(projectId));
    return "added" as const;
  }

  return (
    <FavoritesContext.Provider value={{ userId, loaded, favoriteIds, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
