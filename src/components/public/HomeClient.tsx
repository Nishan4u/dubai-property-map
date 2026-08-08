"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { List, Map as MapIcon, X } from "lucide-react";
import { SiteHeader } from "@/components/public/SiteHeader";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { convertToAed } from "@/lib/i18n/currency";
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
import { PartnerDevelopersSlider, type SliderClickBehavior } from "@/components/public/PartnerDevelopersSlider";
import { MapAccessOverlay } from "@/components/public/MapAccessOverlay";
import { approxDistanceKm, getInvestmentScore, isNearMetro } from "@/lib/investmentScore";
import { pointInPolygon, type GeoSearchRegion, type MapViewState } from "@/lib/geoSearch";
import { getProjectStatusLabel } from "@/lib/projectStatus";
import { useSearchTracking } from "@/lib/useSearchTracking";
import { createClient } from "@/lib/supabase/client";
import { AdUnit } from "@/components/ads/AdUnit";
import { AD_SLOTS } from "@/lib/adSlots";
import { UpcomingProjectInterestModal } from "@/components/public/UpcomingProjectInterestModal";
import type { MapAccessStatus } from "@/lib/supabase/queries";
import type { Community, Developer, ListingType, Project, ProjectTag } from "@/types";
import type { UpcomingProjectPublicRow } from "@/types/database";

interface HomepageBanner {
  id: string;
  title: string;
  targetUrl: string | null;
  developerName?: string;
  imageUrl?: string | null;
}

const HEAT_LAYER_KEYS = ["price-heat", "score-heat"];

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
  developerInactiveForSalesperson = false,
  sliderClickBehavior = "guest",
  upcomingProjects = [],
  adsEnabled = true,
}: {
  communities: Community[];
  developers: Developer[];
  projects: Project[];
  banner: HomepageBanner | null;
  sidebarBanner?: HomepageBanner | null;
  sponsoredPinIds?: string[];
  navLinks?: { label: string; url: string }[];
  /** Public "Coming Soon" teaser pins (spec section 13) -- always fetched
   * regardless of mapAccessStatus, since these are deliberately public. */
  upcomingProjects?: UpcomingProjectPublicRow[];
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
  /** Set when the viewer is a salesperson whose assigned developer's own
   * account/subscription has lapsed — `projects` is already empty in this
   * case too, but the Map itself stays usable (this is a separate check
   * from mapAccessStatus, which covers the salesperson's own subscription). */
  developerInactiveForSalesperson?: boolean;
  sliderClickBehavior?: SliderClickBehavior;
  /** Admin's AdSense on/off switch (/admin/settings) -- resolved
   * server-side by page.tsx via isAdsEnabled(). */
  adsEnabled?: boolean;
}) {
  const { currency } = useLocale();
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
  // Radius Search / Draw Search Area / Nearby ("Near Me") share one region
  // filter -- see src/lib/geoSearch.ts. searchToolMode drives what a map
  // click does right now (idle / picking a radius center / adding a draw
  // vertex); drawPoints only holds an in-progress polygon before "Finish".
  const [searchToolMode, setSearchToolMode] = useState<"idle" | "radius-pick" | "drawing">("idle");
  const [geoSearchRegion, setGeoSearchRegion] = useState<GeoSearchRegion | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  // Save Map View: the live viewport is read from this ref (kept current
  // by DubaiMap's onViewChange, fired on every 'moveend') only at the
  // moment "Save This Search" is clicked -- not held in React state, so
  // panning/zooming the map never triggers a re-render here.
  const mapViewRef = useRef<MapViewState | null>(null);
  const [restoreView, setRestoreView] = useState<MapViewState | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    null
  );
  const [bannerOpen, setBannerOpen] = useState(true);
  // Set when a broker clicks "I'm Interested" on a Coming Soon pin's
  // popup (DubaiMap's onExpressInterest) -- the modal itself resolves
  // whether the viewer is actually a signed-in broker.
  const [interestUpcoming, setInterestUpcoming] = useState<UpcomingProjectPublicRow | null>(null);
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

  // Google's AdSense script (loaded for the homepage banner's
  // data-full-width-responsive unit) walks up the DOM from the ad and, to
  // make sure its own box isn't clipped, mutates ancestor elements -- in
  // practice this means it stamps `style="height: auto !important;"`
  // directly onto this root div, overriding the fixed height it needs to
  // stay pinned to the viewport. That inline !important always wins over any
  // CSS rule we could add here, so the only real fix is to strip it back
  // out the moment AdSense (or anything else) sets it -- this div never
  // sets its own inline style anywhere in this component, so any `style`
  // attribute found on it is always an unwanted third-party side effect.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const stripInjectedStyle = () => {
      if (el.getAttribute("style")) el.removeAttribute("style");
    };
    stripInjectedStyle();
    const observer = new MutationObserver(stripInjectedStyle);
    observer.observe(el, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

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

  // AiChatWidget lives in the root layout, outside this component tree, so
  // it has no way to read isFullscreen (or rootRef) directly -- it hears
  // about both over this event instead. Sending the container along lets
  // it portal itself inside rootRef while fullscreen is active, rather than
  // just hiding: native fullscreen promotes rootRef to the browser's "top
  // layer" and the widget's fixed-position node isn't part of that unless
  // it's an actual DOM descendant, and the simulated/CSS overlay path has
  // the same stacking problem without a browser API to lean on -- portaling
  // solves both the same way.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("dpm:map-fullscreen", {
        detail: { active: isFullscreen, container: isFullscreen ? rootRef.current : null },
      })
    );
  }, [isFullscreen]);

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
      .select("filters, map_view")
      .eq("id", savedSearchId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.filters) setFilters(data.filters as ProjectFilters);
        const view = data?.map_view as MapViewState | null;
        if (view) {
          setActiveLayers(view.activeLayers ?? []);
          setRestoreView(view);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSearchId]);

  function handleMapViewChange(view: Omit<MapViewState, "activeLayers">) {
    mapViewRef.current = { ...view, activeLayers };
  }

  function getMapView(): MapViewState | null {
    return mapViewRef.current;
  }

  function toggleLayer(key: string) {
    setActiveLayers((prev) => {
      const isActive = prev.includes(key);
      if (isActive) return prev.filter((l) => l !== key);
      // Price Heat Map and Investment Score Heat Map are both full-map
      // color fills -- showing both together would just wash each other
      // out, so turning one on replaces the other instead of stacking.
      if (HEAT_LAYER_KEYS.includes(key)) {
        return [...prev.filter((l) => !HEAT_LAYER_KEYS.includes(l)), key];
      }
      return [...prev, key];
    });
  }

  function handleStartRadiusSearch() {
    setDrawPoints([]);
    setSearchToolMode((m) => (m === "radius-pick" ? "idle" : "radius-pick"));
  }

  function handleStartDraw() {
    setDrawPoints([]);
    setSearchToolMode((m) => (m === "drawing" ? "idle" : "drawing"));
  }

  function handleClearGeoSearch() {
    setGeoSearchRegion(null);
    setDrawPoints([]);
    setSearchToolMode("idle");
  }

  function handleRadiusChange(km: number) {
    setRadiusKm(km);
    setGeoSearchRegion((prev) => (prev?.type === "radius" ? { ...prev, radiusKm: km } : prev));
  }

  // Real geolocation via the browser's native API -- never an assumed or
  // fabricated location. Falls back to nothing (button just no-ops with an
  // alert) in unsupported/denied cases rather than guessing a center.
  function handleNearMe() {
    if (!navigator.geolocation) {
      window.alert("Location services aren't available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDrawPoints([]);
        setSearchToolMode("idle");
        setGeoSearchRegion({
          type: "radius",
          center: [pos.coords.longitude, pos.coords.latitude],
          radiusKm,
        });
      },
      () => {
        window.alert("Couldn't get your location. Check your browser's location permission.");
      }
    );
  }

  // Routed from DubaiMap's own map click handler, only while a search tool
  // is actively picking a center or collecting draw vertices.
  function handleSearchMapClick(lng: number, lat: number) {
    if (searchToolMode === "radius-pick") {
      setGeoSearchRegion({ type: "radius", center: [lng, lat], radiusKm });
      setSearchToolMode("idle");
    } else if (searchToolMode === "drawing") {
      setDrawPoints((prev) => [...prev, [lng, lat]]);
    }
  }

  function handleFinishDraw() {
    if (drawPoints.length < 3) return;
    setGeoSearchRegion({ type: "polygon", ring: [...drawPoints, drawPoints[0]] });
    setDrawPoints([]);
    setSearchToolMode("idle");
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
      // Min/max are typed in the viewer's selected currency (see the
      // "Price Range ({currency})" label in FilterSidebar.tsx) but
      // priceFromAed is always AED, so the entered values are converted
      // back to AED here before comparing.
      if (filters.priceMin && p.priceFromAed < convertToAed(Number(filters.priceMin), currency)) return false;
      if (filters.priceMax && p.priceFromAed > convertToAed(Number(filters.priceMax), currency)) return false;
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
      if (filters.buildingAgeMax) {
        const max = Number(filters.buildingAgeMax);
        if (p.buildingAgeYears == null || p.buildingAgeYears > max) return false;
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
      if (filters.furnishing && p.furnishing !== filters.furnishing) return false;
      if (filters.completionStatus && getProjectStatusLabel(p) !== filters.completionStatus) return false;
      if (filters.unitType && !(p.structuredUnitTypes ?? []).includes(filters.unitType)) return false;
      if (filters.sizeSqftMin) {
        const min = Number(filters.sizeSqftMin);
        if (p.unitSizeSqftMax == null || p.unitSizeSqftMax < min) return false;
      }
      if (filters.sizeSqftMax) {
        const max = Number(filters.sizeSqftMax);
        if (p.unitSizeSqftMin == null || p.unitSizeSqftMin > max) return false;
      }
      if (geoSearchRegion) {
        if (p.lat == null || p.lng == null) return false;
        if (geoSearchRegion.type === "radius") {
          const d = approxDistanceKm(
            p.lat,
            p.lng,
            geoSearchRegion.center[1],
            geoSearchRegion.center[0]
          );
          if (d > geoSearchRegion.radiusKm) return false;
        } else if (!pointInPolygon(p.lng, p.lat, geoSearchRegion.ring)) {
          return false;
        }
      }
      return true;
    });
  }, [allProjects, activeTab, activeTag, filters, searchQuery, currency, geoSearchRegion]);

  useSearchTracking(searchQuery, "map", filteredProjects.length);

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
        // min-h-0 is required here: this div is itself a flex child of
        // <body> (layout.tsx's "flex flex-col"), so without it the browser's
        // flex "automatic minimum size" rule lets this div grow taller than
        // its explicit height whenever its content's natural height
        // exceeds the viewport -- which is exactly what started happening
        // once the homepage AdSense banner + slider pushed total content
        // height past the viewport, forcing the whole page (and the map
        // area below it) to overflow and require scrolling to reach the
        // map's own bottom controls (POI bar, Map/Satellite, fullscreen).
        //
        // h-dvh (not h-screen/100vh) on both branches: on a real phone or
        // tablet, the browser's address bar collapses/expands as you
        // scroll, and 100vh is fixed to the LARGEST possible viewport (bar
        // hidden) -- so right after a refresh, with the bar still visible,
        // 100vh is taller than what's actually on screen and the page
        // needs a scroll to reach the bottom controls. 100dvh tracks the
        // real, current visible height instead, exactly like the existing
        // simulatedFullscreen branch already did.
        "flex min-h-0 flex-col bg-navy-950 h-dvh",
        simulatedFullscreen && "fixed inset-0 z-[100]"
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
        searchResults={filteredProjects}
        onSelectResult={handleSelectSearchResult}
        searchDisabled={mapAccessStatus !== "ok"}
      />
      {banner && bannerOpen && (
        <div className="relative flex items-center gap-3 bg-gold-500/15 px-6 py-2 text-xs">
          <Link
            href={banner.targetUrl ? `/api/ads/click/${banner.id}` : "#"}
            className="flex-1 truncate text-ink-200 hover:text-gold-300"
          >
            {banner.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner.imageUrl} alt={banner.title} className="h-10 w-full object-cover" />
            ) : (
              <>
                <span className="font-semibold text-gold-400">Sponsored</span>{" "}
                {banner.title}
                {banner.developerName ? ` — ${banner.developerName}` : ""}
              </>
            )}
          </Link>
          <button
            onClick={() => setBannerOpen(false)}
            className="shrink-0 text-ink-500 hover:text-ink-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {developerInactiveForSalesperson && (
        <div className="border-b border-amber-600/30 bg-amber-500/10 px-6 py-3 text-center text-sm">
          <p className="font-semibold text-amber-300">Developer Account Inactive</p>
          <p className="mt-0.5 text-xs text-amber-200/80">
            Your developer&apos;s subscription has expired. Project access is temporarily unavailable. Please contact your developer.
          </p>
        </div>
      )}
      {!isFullscreen && (
        <>
          {adsEnabled && (
            <AdUnit slot={AD_SLOTS.homepageBanner} format="horizontal" className="px-4 pt-2 sm:px-6" />
          )}
          <PartnerDevelopersSlider developers={developers} clickBehavior={sliderClickBehavior} />
        </>
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
              getMapView={getMapView}
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
            upcomingProjects={upcomingProjects}
            searchToolMode={searchToolMode}
            geoSearchRegion={geoSearchRegion}
            drawPoints={drawPoints}
            onSearchMapClick={handleSearchMapClick}
            onViewChange={handleMapViewChange}
            restoreView={restoreView}
            onNearMe={handleNearMe}
            onStartRadius={handleStartRadiusSearch}
            onStartDraw={handleStartDraw}
            onClearGeoSearch={handleClearGeoSearch}
            onFinishDraw={handleFinishDraw}
            radiusKm={radiusKm}
            onRadiusChange={handleRadiusChange}
            onExpressInterest={setInterestUpcoming}
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
          {/* MapAmenityBar is icon-only/compact at every breakpoint (not
             just mobile) specifically so it always fits this reserved
             strip beside Map/Satellite -- including at lg: and up, where
             the 3-column filters+list+map layout can leave the map panel
             itself quite narrow. If it still doesn't fully fit, its own
             overflow-x-auto scrolls rather than overlapping anything. */}
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
                getMapView={getMapView}
              />
            </div>
          </div>
        </div>
      )}

      {interestUpcoming && (
        <UpcomingProjectInterestModal
          upcomingProjectId={interestUpcoming.id}
          developerId={interestUpcoming.developer_id}
          developerName={interestUpcoming.developer_name}
          onClose={() => setInterestUpcoming(null)}
        />
      )}
    </div>
  );
}
