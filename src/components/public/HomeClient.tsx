"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { List, Map as MapIcon, X } from "lucide-react";
import { SiteHeader } from "@/components/public/SiteHeader";
import {
  FilterSidebar,
  emptyFilters,
  type ProjectFilters,
} from "@/components/public/FilterSidebar";
import { ProjectListPanel } from "@/components/public/ProjectListPanel";
import { DubaiMap } from "@/components/public/DubaiMap";
import { MapFilterChips } from "@/components/public/MapFilterChips";
import { MapAmenityBar } from "@/components/public/MapAmenityBar";
import { FeaturedProjectCard } from "@/components/public/FeaturedProjectCard";
import { PartnerDevelopersSlider } from "@/components/public/PartnerDevelopersSlider";
import { MapAccessOverlay } from "@/components/public/MapAccessOverlay";
import { getInvestmentScore, isNearMetro } from "@/lib/investmentScore";
import { createClient } from "@/lib/supabase/client";
import type { MapAccessStatus } from "@/lib/supabase/queries";
import type { Community, Developer, ListingType, Project, ProjectTag } from "@/types";

interface HomepageBanner {
  title: string;
  targetUrl: string | null;
  developerName?: string;
}

export function HomeClient({
  communities,
  developers,
  projects: allProjects,
  banner,
  sidebarBanner,
  sponsoredPinIds,
  navLinks,
  viewerDeveloperId = null,
  mapAccessStatus = "ok",
  subscriptionHref = "",
}: {
  communities: Community[];
  developers: Developer[];
  projects: Project[];
  banner: HomepageBanner | null;
  sidebarBanner?: HomepageBanner | null;
  sponsoredPinIds?: string[];
  navLinks?: { label: string; url: string }[];
  /** Set when the logged-in viewer is a Developer or Salesperson account —
   * `projects` has already been scoped to their developer server-side; this
   * just tells the UI to lock/hide the Developer filter and other-developer
   * directory bits instead of offering choices that would be a no-op. */
  viewerDeveloperId?: string | null;
  /** Server-determined Map access — "ok" for everyone except a guest, an
   * unverified/inactive account, or a broker/salesperson without an
   * eligible active subscription. `projects` is already empty whenever
   * this isn't "ok" (the real dataset was never fetched server-side). */
  mapAccessStatus?: MapAccessStatus;
  subscriptionHref?: string;
}) {
  const validTags: (ProjectTag | "all")[] = [
    "new-launch",
    "luxury",
    "waterfront",
    "villas",
    "under-1m",
    "high-roi",
  ];

  const [activeTab, setActiveTab] = useState<ListingType>("buy");
  const [filters, setFilters] = useState<ProjectFilters>(emptyFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    null
  );
  const [bannerOpen, setBannerOpen] = useState(true);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // iOS/iPadOS Safari has never supported the Fullscreen API on arbitrary
  // elements (only on <video>), so requestFullscreen() there silently
  // rejects and nothing used to happen when tapping the button. When that's
  // the case (or the API doesn't exist at all), fall back to a fixed,
  // full-viewport overlay instead — same UI branching as real fullscreen,
  // just without asking the browser's chrome to hide.
  const [simulatedFullscreen, setSimulatedFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const savedSearchId = searchParams.get("saved");
  const tagParam = searchParams.get("tag");
  const [activeTag, setActiveTag] = useState<ProjectTag | "all">(
    validTags.includes(tagParam as ProjectTag) ? (tagParam as ProjectTag) : "all"
  );

  useEffect(() => {
    if (tagParam && validTags.includes(tagParam as ProjectTag)) {
      setActiveTag(tagParam as ProjectTag);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagParam]);

  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement === rootRef.current) {
        setIsFullscreen(true);
        return;
      }
      // Native fullscreen exited (Esc, browser UI, etc.) — only clear
      // isFullscreen here if we're not in the CSS-only simulated mode,
      // which never touches document.fullscreenElement at all.
      setSimulatedFullscreen((sim) => {
        if (!sim) setIsFullscreen(false);
        return sim;
      });
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!simulatedFullscreen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSimulatedFullscreen(false);
        setIsFullscreen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [simulatedFullscreen]);

  function handleFullscreenToggle() {
    if (isFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        setSimulatedFullscreen(false);
        setIsFullscreen(false);
      }
      return;
    }

    const canUseNativeFullscreen =
      typeof document.fullscreenEnabled === "boolean" ? document.fullscreenEnabled : !!rootRef.current?.requestFullscreen;

    if (canUseNativeFullscreen && rootRef.current?.requestFullscreen) {
      rootRef.current
        .requestFullscreen()
        .catch(() => {
          // iOS/iPadOS Safari (and any other browser that rejects this on
          // arbitrary elements) falls back to the CSS-only viewport mode.
          setSimulatedFullscreen(true);
          setIsFullscreen(true);
        });
    } else {
      setSimulatedFullscreen(true);
      setIsFullscreen(true);
    }
  }

  function handleSelectProject(project: Project) {
    setSelectedCommunityId(project.communityId);
    setFocusProjectId(project.id);
    setMobileView("map");
  }

  function handleSelectSearchResult(project: Project) {
    handleSelectProject(project);
    setSearchQuery("");
  }

  useEffect(() => {
    if (!savedSearchId) return;
    const supabase = createClient();
    supabase
      .from("saved_searches")
      .select("filters")
      .eq("id", savedSearchId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.filters) setFilters(data.filters as ProjectFilters);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSearchId]);

  function toggleLayer(key: string) {
    setActiveLayers((prev) =>
      prev.includes(key) ? prev.filter((l) => l !== key) : [...prev, key]
    );
  }

  const propertyTypes = useMemo(
    () => Array.from(new Set(allProjects.map((p) => p.propertyType))).sort(),
    [allProjects]
  );
  const paymentPlans = useMemo(
    () =>
      Array.from(new Set(allProjects.map((p) => p.paymentPlan).filter(Boolean))).sort(),
    [allProjects]
  );
  const handoverYears = useMemo(
    () =>
      Array.from(new Set(allProjects.map((p) => p.handoverYear).filter(Boolean))).sort(
        (a, b) => a - b
      ),
    [allProjects]
  );

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allProjects.filter((p) => {
      if (activeTab !== "buy" && p.listingType !== activeTab) return false;
      if (activeTag !== "all" && !p.tags.includes(activeTag)) return false;
      if (query) {
        const haystack = `${p.name} ${p.developerName ?? ""} ${p.communityName ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (
        filters.location &&
        !(p.communityName ?? "").toLowerCase().includes(filters.location.trim().toLowerCase())
      )
        return false;
      if (filters.developerId && p.developerId !== filters.developerId) return false;
      if (filters.communityId && p.communityId !== filters.communityId) return false;
      if (filters.propertyType && p.propertyType !== filters.propertyType) return false;
      if (filters.priceMin && p.priceFromAed < Number(filters.priceMin)) return false;
      if (filters.priceMax && p.priceFromAed > Number(filters.priceMax)) return false;
      if (filters.bedrooms) {
        const bed = Number(filters.bedrooms);
        const matches =
          bed === 4
            ? p.bedroomsTo >= 4
            : p.bedroomsFrom <= bed && p.bedroomsTo >= bed;
        if (!matches) return false;
      }
      if (filters.handoverYear && String(p.handoverYear) !== filters.handoverYear)
        return false;
      if (filters.paymentPlan && p.paymentPlan !== filters.paymentPlan) return false;
      if (filters.offPlan || filters.ready) {
        const allowed = [
          ...(filters.offPlan ? ["off-plan"] : []),
          ...(filters.ready ? ["ready"] : []),
        ];
        if (!allowed.includes(p.listingType)) return false;
      }
      if (filters.nearMetro && !isNearMetro(p)) return false;
      if (
        filters.minInvestmentScore &&
        getInvestmentScore(p) < Number(filters.minInvestmentScore)
      )
        return false;
      // Blank/unset escrow status only ever shows under "All" — never
      // matches a specific Available/Not Available selection.
      if (filters.escrowStatus && p.escrowStatus !== filters.escrowStatus) return false;
      return true;
    });
  }, [allProjects, activeTab, activeTag, filters, searchQuery]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([, v]) =>
      typeof v === "boolean" ? v : v !== ""
    ).length;
  }, [filters]);

  const featuredProjects = useMemo(() => {
    const marked = filteredProjects.filter((p) => p.featured);
    return marked.length > 0 ? marked : filteredProjects.slice(0, 1);
  }, [filteredProjects]);

  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredExpanded, setFeaturedExpanded] = useState(false);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [featuredProjects]);

  useEffect(() => {
    if (featuredProjects.length <= 1 || featuredExpanded) return;
    const id = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % featuredProjects.length);
    }, 7000);
    return () => clearInterval(id);
  }, [featuredProjects.length, featuredExpanded]);

  const featuredProject = featuredProjects[featuredIndex] ?? featuredProjects[0];

  return (
    <div
      ref={rootRef}
      className={clsx(
        "flex flex-col bg-navy-950",
        simulatedFullscreen ? "fixed inset-0 z-[100] h-[100dvh]" : "h-screen"
      )}
    >
      <SiteHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFiltersClick={() => setMobileFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        navLinks={navLinks}
        searchResults={isFullscreen ? filteredProjects : undefined}
        onSelectResult={handleSelectSearchResult}
        searchDisabled={mapAccessStatus !== "ok"}
      />
      {banner && bannerOpen && (
        <div className="flex items-center justify-between gap-3 bg-gold-500/15 px-6 py-2 text-xs">
          <Link
            href={banner.targetUrl ?? "#"}
            className="flex-1 truncate text-ink-200 hover:text-gold-300"
          >
            <span className="font-semibold text-gold-400">Sponsored</span>{" "}
            {banner.title}
            {banner.developerName ? ` — ${banner.developerName}` : ""}
          </Link>
          <button
            onClick={() => setBannerOpen(false)}
            className="shrink-0 text-ink-500 hover:text-ink-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {!isFullscreen && !viewerDeveloperId && (
        <PartnerDevelopersSlider developers={developers} />
      )}
      <div className="relative flex min-h-0 flex-1">
        <div
          className={clsx(
            "flex min-h-0 flex-1",
            mapAccessStatus !== "ok" && "pointer-events-none select-none blur-sm"
          )}
        >
        {!isFullscreen && (
          <div className="hidden lg:block">
            <FilterSidebar
              developers={developers}
              communities={communities}
              propertyTypes={propertyTypes}
              paymentPlans={paymentPlans}
              handoverYears={handoverYears}
              filters={filters}
              onApply={setFilters}
              sidebarBanner={sidebarBanner}
              viewerDeveloperId={viewerDeveloperId}
            />
          </div>
        )}
        {!isFullscreen && (
          <div
            className={clsx(
              mobileView === "list" ? "flex w-full" : "hidden",
              "lg:flex lg:w-auto"
            )}
          >
            <ProjectListPanel
              projects={filteredProjects}
              onSelectProject={handleSelectProject}
            />
          </div>
        )}
        <div
          className={clsx(
            "relative flex-1",
            mobileView === "list" && !isFullscreen && "hidden lg:block"
          )}
        >
          <div className="absolute left-4 right-56 top-4 z-10">
            <MapFilterChips active={activeTag} onChange={setActiveTag} />
          </div>
          <DubaiMap
            communities={communities}
            projects={filteredProjects}
            selectedCommunityId={selectedCommunityId}
            onSelectCommunity={setSelectedCommunityId}
            activeLayers={activeLayers}
            sponsoredPinIds={sponsoredPinIds}
            focusProjectId={focusProjectId}
            isFullscreen={isFullscreen}
            onFullscreenToggle={handleFullscreenToggle}
          />
          {featuredProject && (
            <FeaturedProjectCard
              key={featuredProject.id}
              project={featuredProject}
              total={featuredProjects.length}
              index={featuredIndex}
              onExpandChange={setFeaturedExpanded}
            />
          )}
          <div className="absolute bottom-4 left-4 right-52 z-10">
            <MapAmenityBar active={activeLayers} onToggle={toggleLayer} />
          </div>
        </div>
        </div>
        {mapAccessStatus !== "ok" && (
          <MapAccessOverlay status={mapAccessStatus} subscriptionHref={subscriptionHref} />
        )}
      </div>

      {!isFullscreen && !selectedCommunityId && (
        <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 lg:hidden">
          <div className="flex items-center gap-1 rounded-full border border-navy-700 bg-navy-900 p-1 shadow-2xl">
            <button
              onClick={() => setMobileView("map")}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold",
                mobileView === "map"
                  ? "bg-gold-500 text-navy-950"
                  : "text-ink-300"
              )}
            >
              <MapIcon className="h-3.5 w-3.5" /> Map
            </button>
            <button
              onClick={() => setMobileView("list")}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold",
                mobileView === "list"
                  ? "bg-gold-500 text-navy-950"
                  : "text-ink-300"
              )}
            >
              <List className="h-3.5 w-3.5" /> List ({filteredProjects.length})
            </button>
          </div>
        </div>
      )}

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative z-10 flex h-full w-[85vw] max-w-sm flex-col bg-navy-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-navy-700 p-3">
              <h3 className="text-sm font-semibold text-ink-100">
                Search &amp; Filters
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-ink-400 hover:text-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <FilterSidebar
                developers={developers}
                communities={communities}
                propertyTypes={propertyTypes}
                paymentPlans={paymentPlans}
                handoverYears={handoverYears}
                filters={filters}
                onApply={(f) => {
                  setFilters(f);
                  setMobileFiltersOpen(false);
                }}
                sidebarBanner={sidebarBanner}
                viewerDeveloperId={viewerDeveloperId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
