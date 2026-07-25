"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  Bell,
  Download,
  Heart,
  Search,
  User,
  CalendarClock,
} from "lucide-react";
import { ProjectCard } from "@/components/public/ProjectCard";
import { useFavorites } from "@/components/auth/FavoritesProvider";
import { useCommunityFavorites } from "@/components/auth/CommunityFavoritesProvider";
import { ProfileTab } from "@/components/account/ProfileTab";
import { ViewingRequestsTab } from "@/components/account/ViewingRequestsTab";
import { SavedSearchesTab } from "@/components/account/SavedSearchesTab";
import { BrochuresTab } from "@/components/account/BrochuresTab";
import { NotificationsTab } from "@/components/account/NotificationsTab";
import { createClient } from "@/lib/supabase/client";
import { mapProject } from "@/lib/supabase/mappers";
import type { Project } from "@/types";
import type { CommunityRow, ProjectWithRelations } from "@/types/database";

const tabs = [
  { key: "profile", label: "Profile", icon: User },
  { key: "favorites", label: "Favorites", icon: Heart },
  { key: "viewing", label: "Viewing Requests", icon: CalendarClock },
  { key: "searches", label: "Saved Searches", icon: Search },
  { key: "brochures", label: "Downloaded Brochures", icon: Download },
  { key: "notifications", label: "Notifications", icon: Bell },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function AccountPageClient() {
  const { userId, loaded, favoriteIds } = useFavorites();
  const { favoriteCommunityIds } = useCommunityFavorites();
  const [active, setActive] = useState<TabKey>("profile");
  const [favProjects, setFavProjects] = useState<Project[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [favCommunities, setFavCommunities] = useState<CommunityRow[]>([]);
  const [favCommunitiesLoading, setFavCommunitiesLoading] = useState(true);

  useEffect(() => {
    if (!loaded) return;
    if (favoriteIds.size === 0) {
      setFavProjects([]);
      setFavLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("projects")
      .select("*, developers(*), communities(*)")
      .in("id", Array.from(favoriteIds))
      .then(({ data }) => {
        setFavProjects(((data ?? []) as ProjectWithRelations[]).map(mapProject));
        setFavLoading(false);
      });
  }, [loaded, favoriteIds]);

  useEffect(() => {
    if (!loaded) return;
    if (favoriteCommunityIds.size === 0) {
      setFavCommunities([]);
      setFavCommunitiesLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("communities")
      .select("*")
      .in("id", Array.from(favoriteCommunityIds))
      .then(({ data }) => {
        setFavCommunities((data ?? []) as CommunityRow[]);
        setFavCommunitiesLoading(false);
      });
  }, [loaded, favoriteCommunityIds]);

  if (loaded && !userId) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-sm text-ink-400">
          <Link href="/login" className="text-gold-400 hover:underline">
            Log in
          </Link>{" "}
          to view your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-6 py-10">
      <aside className="w-60 shrink-0 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={clsx(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              active === tab.key
                ? "bg-gold-500 text-navy-950"
                : "text-ink-300 hover:bg-navy-800 hover:text-ink-100"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </aside>
      <div className="min-h-[400px] flex-1 rounded-xl border border-navy-700 bg-navy-850">
        {!userId ? (
          <p className="p-6 text-sm text-ink-500">Loading…</p>
        ) : active === "profile" ? (
          <ProfileTab userId={userId} />
        ) : active === "favorites" ? (
          <div className="space-y-8 p-6">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink-100">
                Favorite Projects
              </h3>
              {favLoading ? (
                <p className="text-sm text-ink-500">Loading favorites…</p>
              ) : favProjects.length === 0 ? (
                <p className="text-sm text-ink-500">
                  No favorites yet — tap the heart icon on any project to
                  save it here.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {favProjects.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink-100">
                Favorite Communities
              </h3>
              {favCommunitiesLoading ? (
                <p className="text-sm text-ink-500">Loading communities…</p>
              ) : favCommunities.length === 0 ? (
                <p className="text-sm text-ink-500">
                  No saved communities yet — tap &quot;Save Community&quot;
                  on any community page.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {favCommunities.map((c) => (
                    <Link
                      key={c.id}
                      href={`/communities/${c.slug}`}
                      className="rounded-lg border border-navy-700 bg-navy-900 p-4 hover:border-gold-500/40"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: c.pin_color }}
                        />
                        <p className="text-sm font-medium text-ink-100">
                          {c.name}
                        </p>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-ink-500">
                        {c.description}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : active === "viewing" ? (
          <ViewingRequestsTab userId={userId} />
        ) : active === "searches" ? (
          <SavedSearchesTab userId={userId} />
        ) : active === "brochures" ? (
          <BrochuresTab userId={userId} />
        ) : (
          <NotificationsTab userId={userId} />
        )}
      </div>
    </div>
  );
}
