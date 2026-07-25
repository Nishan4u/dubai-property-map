"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CommunityFavoritesContextValue {
  userId: string | null;
  loaded: boolean;
  favoriteCommunityIds: Set<string>;
  toggle: (communityId: string) => Promise<"added" | "removed" | "needs-login">;
}

const CommunityFavoritesContext = createContext<CommunityFavoritesContextValue | null>(
  null
);

export function CommunityFavoritesProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteCommunityIds, setFavoriteCommunityIds] = useState<Set<string>>(
    new Set()
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setFavoriteCommunityIds(new Set());
        setLoaded(true);
        return;
      }

      setUserId(user.id);
      const { data } = await supabase
        .from("favorite_communities")
        .select("community_id")
        .eq("user_id", user.id);

      setFavoriteCommunityIds(new Set((data ?? []).map((f) => f.community_id)));
      setLoaded(true);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());

    return () => subscription.unsubscribe();
  }, []);

  async function toggle(communityId: string) {
    if (!userId) return "needs-login" as const;

    const supabase = createClient();
    const isFavorited = favoriteCommunityIds.has(communityId);

    if (isFavorited) {
      await supabase
        .from("favorite_communities")
        .delete()
        .eq("user_id", userId)
        .eq("community_id", communityId);
      setFavoriteCommunityIds((prev) => {
        const next = new Set(prev);
        next.delete(communityId);
        return next;
      });
      return "removed" as const;
    }

    await supabase
      .from("favorite_communities")
      .insert({ user_id: userId, community_id: communityId });
    setFavoriteCommunityIds((prev) => new Set(prev).add(communityId));
    return "added" as const;
  }

  return (
    <CommunityFavoritesContext.Provider
      value={{ userId, loaded, favoriteCommunityIds, toggle }}
    >
      {children}
    </CommunityFavoritesContext.Provider>
  );
}

export function useCommunityFavorites() {
  const ctx = useContext(CommunityFavoritesContext);
  if (!ctx)
    throw new Error(
      "useCommunityFavorites must be used within CommunityFavoritesProvider"
    );
  return ctx;
}
