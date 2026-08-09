"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import type { Project, Developer, Community } from "@/types";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { convertToAed } from "@/lib/i18n/currency";
import { ProjectCard } from "@/components/public/ProjectCard";
import { FilterSidebar, emptyFilters, type ProjectFilters } from "@/components/public/FilterSidebar";
import { ProjectAccessGate } from "@/components/public/ProjectAccessGate";
import { ProjectGridSkeleton } from "@/components/public/ProjectGridSkeleton";
import { CompactSelect } from "@/components/public/CompactSelect";
import { isNearMetro, getInvestmentScore } from "@/lib/investmentScore";
import { getProjectStatusLabel } from "@/lib/projectStatus";
import { useSearchTracking } from "@/lib/useSearchTracking";
import type { MapAccessStatus } from "@/lib/supabase/queries";
import { AdUnit } from "@/components/ads/AdUnit";
import { AD_SLOTS } from "@/lib/adSlots";

// One in-feed ad after every 9 cards -- frequent enough to matter on a
// long "Load More" list, not so frequent it dominates the grid.
const IN_FEED_EVERY = 9;

const sortOptions = ["Featured", "Newest", "Recently Updated", "Lowest Price", "Highest Price", "High ROI", "Handover"] as const;
type SortOption = (typeof sortOptions)[number];

function sortProjects(projects: Project[], sort: SortOption): Project[] {
  const sorted = [...projects];
  switch (sort) {
    case "Featured":
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
    case "Newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    case "Recently Updated":
      return sorted.sort(
        (a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
      );
    case "Lowest Price":
      return sorted.sort((a, b) => a.priceFromAed - b.priceFromAed);
    case "Highest Price":
      return sorted.sort((a, b) => b.priceFromAed - a.priceFromAed);
    case "High ROI":
      return sorted.sort(
        (a, b) => Number(b.tags.includes("high-roi")) - Number(a.tags.includes("high-roi"))
      );
    case "Handover":
      return sorted.sort((a, b) => (a.handoverYear || 9999) - (b.handoverYear || 9999));
    default:
      return sorted;
  }
}

export function AllProjectsClient({
  projects,
  developers,
  communities,
  mapAccessStatus,
  subscriptionHref,
  viewerDeveloperId,
  adsEnabled = true,
  inFeedBanner = null,
}: {
  projects: Project[];
  developers: Developer[];
  communities: Community[];
  mapAccessStatus: MapAccessStatus;
  subscriptionHref: string;
  viewerDeveloperId: string | null;
  /** Admin's AdSense on/off switch (/admin/settings) -- resolved
   * server-side by the parent page via isAdsEnabled(). */
  adsEnabled?: boolean;
  /** Admin-uploaded custom banner image for the same in-feed slot -- runs
   * independently of adsEnabled, same as the homepage banner strip
   * running alongside (not instead of) the homepage AdSense unit. */
  inFeedBanner?: {
    id: string;
    title: string;
    targetUrl: string | null;
    developerName?: string;
    imageUrl?: string | null;
  } | null;
}) {
  const { currency } = useLocale();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");
  const [searchQuery, setSearchQuery] = useState("");

  // Seeds the search box from ?q=... -- makes /projects?q=... a real,
  // working search URL rather than just a filtered-in-the-browser state,
  // which is what the homepage's WebSite/SearchAction structured data
  // (Google's sitelinks search box) links to.
  useEffect(() => {
    // Not just a lazy useState initializer -- this component can stay
    // mounted across a client-side navigation to a new ?q=... (e.g.
    // clicking another "search" link while already on /projects), so it
    // needs to keep syncing to qParam after mount too, not just seed it
    // once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (qParam) setSearchQuery(qParam);
  }, [qParam]);
  const [filters, setFilters] = useState<ProjectFilters>(emptyFilters);
  const [sort, setSort] = useState<SortOption>("Featured");
  const [visible, setVisible] = useState(12);
  // The filter sidebar has ~15 fields -- on mobile, where it stacks above
  // the results instead of sitting beside them, that's a wall of filters
  // before any project is visible. Collapsed by default below lg; always
  // shown at lg and up (unchanged desktop behavior).
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => (typeof v === "boolean" ? v : v !== "")).length,
    [filters]
  );

  const propertyTypes = useMemo(
    () => Array.from(new Set(projects.map((p) => p.propertyType))).sort(),
    [projects]
  );
  const paymentPlans = useMemo(
    () => Array.from(new Set(projects.map((p) => p.paymentPlan).filter(Boolean))).sort(),
    [projects]
  );
  const handoverYears = useMemo(
    () => Array.from(new Set(projects.map((p) => p.handoverYear).filter(Boolean))).sort((a, b) => a - b),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
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
        const matches = bed === 4 ? p.bedroomsTo >= 4 : p.bedroomsFrom <= bed && p.bedroomsTo >= bed;
        if (!matches) return false;
      }
      if (filters.handoverYear && String(p.handoverYear) !== filters.handoverYear) return false;
      if (filters.paymentPlan && p.paymentPlan !== filters.paymentPlan) return false;
      if (filters.offPlan || filters.ready) {
        const allowed = [...(filters.offPlan ? ["off-plan"] : []), ...(filters.ready ? ["ready"] : [])];
        if (!allowed.includes(p.listingType)) return false;
      }
      if (filters.buildingAgeMax) {
        const max = Number(filters.buildingAgeMax);
        if (p.buildingAgeYears == null || p.buildingAgeYears > max) return false;
      }
      if (filters.nearMetro && !isNearMetro(p)) return false;
      if (filters.minInvestmentScore && getInvestmentScore(p) < Number(filters.minInvestmentScore)) return false;
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
      return true;
    });
  }, [projects, filters, searchQuery, currency]);

  useSearchTracking(searchQuery, "projects_list", filteredProjects.length);

  const sortedProjects = useMemo(() => sortProjects(filteredProjects, sort), [filteredProjects, sort]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-100">All Projects</h1>
        <p className="mt-1 text-sm text-ink-400">
          {viewerDeveloperId
            ? "Your published projects, in one searchable, filterable list."
            : "Every project on Dubai Property Map, in one searchable, filterable list."}
        </p>
      </div>

      <ProjectAccessGate
        status={mapAccessStatus}
        subscriptionHref={subscriptionHref}
        titleOverride={{ guest: "Registration Required", no_subscription: "Subscription Required" }}
        bodyOverride={{
          guest: "Register or log in to explore Dubai projects.",
          no_subscription: "An active subscription is required to access All Projects.",
        }}
        subscribeCtaLabel="Subscribe Now"
      >
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-72 lg:shrink-0">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="mb-3 flex w-full items-center justify-between rounded-lg border border-navy-700 bg-navy-850 px-4 py-2.5 text-sm font-medium text-ink-200 lg:hidden"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gold-400" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-semibold text-navy-950">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <ChevronDown
                className={clsx("h-4 w-4 shrink-0 transition-transform", showFilters && "rotate-180")}
              />
            </button>
            <div className={clsx(showFilters ? "block" : "hidden", "lg:block")}>
              <FilterSidebar
                developers={developers}
                communities={communities}
                propertyTypes={propertyTypes}
                paymentPlans={paymentPlans}
                handoverYears={handoverYears}
                filters={filters}
                onApply={(next) => {
                  setFilters(next);
                  setVisible(12);
                  setShowFilters(false);
                }}
                viewerDeveloperId={viewerDeveloperId}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-ink-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisible(12);
                  }}
                  placeholder="Search projects by name, developer or community…"
                  className="w-full min-w-0 bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                />
              </div>
              <CompactSelect
                label="Sort"
                hideLabel
                allowClear={false}
                placeholder="Sort"
                value={sort}
                onChange={(v) => {
                  setSort((v || "Featured") as SortOption);
                  setVisible(12);
                }}
                options={sortOptions.map((opt) => ({ label: `Sort: ${opt}`, value: opt }))}
                className="w-48 shrink-0"
              />
            </div>

            {mapAccessStatus === "ok" && (
              <p className="mt-3 text-xs text-ink-500">
                {sortedProjects.length} project{sortedProjects.length === 1 ? "" : "s"} found
              </p>
            )}

            {mapAccessStatus !== "ok" ? (
              <div className="mt-3">
                <ProjectGridSkeleton />
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {sortedProjects.slice(0, visible).map((project, i) => (
                    <Fragment key={project.id}>
                      <ProjectCard project={project} />
                      {(i + 1) % IN_FEED_EVERY === 0 && (
                        <div className="col-span-full space-y-3">
                          {inFeedBanner && (
                            <Link
                              href={inFeedBanner.targetUrl ? `/api/ads/click/${inFeedBanner.id}` : "#"}
                              className="block overflow-hidden rounded-xl border border-gold-500/30 bg-gold-500/10 hover:border-gold-500/50"
                            >
                              {inFeedBanner.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={inFeedBanner.imageUrl}
                                  alt={inFeedBanner.title}
                                  className="h-24 w-full object-cover sm:h-28"
                                />
                              ) : (
                                <div className="flex items-center gap-3 p-4">
                                  <div>
                                    <p className="text-xs font-semibold text-gold-400">Sponsored</p>
                                    <p className="mt-1 text-sm font-medium text-ink-100">{inFeedBanner.title}</p>
                                    {inFeedBanner.developerName && (
                                      <p className="mt-0.5 text-xs text-ink-500">by {inFeedBanner.developerName}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Link>
                          )}
                          {adsEnabled && <AdUnit slot={AD_SLOTS.projectsListingInFeed} format="horizontal" />}
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
                {sortedProjects.length === 0 && (
                  <p className="mt-6 text-center text-sm text-ink-500">
                    No projects match your search and filters.
                  </p>
                )}
              </>
            )}
            {visible < sortedProjects.length && (
              <button
                onClick={() => setVisible((v) => v + 12)}
                className="mt-4 w-full rounded-lg border border-navy-700 py-2.5 text-sm font-medium text-ink-300 hover:border-gold-500/40 hover:text-gold-400"
              >
                Load More
              </button>
            )}
          </div>
        </div>
      </ProjectAccessGate>
    </div>
  );
}
