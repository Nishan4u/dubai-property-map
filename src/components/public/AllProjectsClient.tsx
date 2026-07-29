"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Project, Developer, Community } from "@/types";
import { ProjectCard } from "@/components/public/ProjectCard";
import { FilterSidebar, emptyFilters, type ProjectFilters } from "@/components/public/FilterSidebar";
import { ProjectAccessGate } from "@/components/public/ProjectAccessGate";
import { ProjectGridSkeleton } from "@/components/public/ProjectGridSkeleton";
import { CompactSelect } from "@/components/public/CompactSelect";
import { isNearMetro, getInvestmentScore } from "@/lib/investmentScore";
import { getProjectStatusLabel } from "@/lib/projectStatus";
import type { MapAccessStatus } from "@/lib/supabase/queries";

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
}: {
  projects: Project[];
  developers: Developer[];
  communities: Community[];
  mapAccessStatus: MapAccessStatus;
  subscriptionHref: string;
  viewerDeveloperId: string | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ProjectFilters>(emptyFilters);
  const [sort, setSort] = useState<SortOption>("Featured");
  const [visible, setVisible] = useState(12);

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
      if (filters.priceMin && p.priceFromAed < Number(filters.priceMin)) return false;
      if (filters.priceMax && p.priceFromAed > Number(filters.priceMax)) return false;
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
  }, [projects, filters, searchQuery]);

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
              }}
              viewerDeveloperId={viewerDeveloperId}
            />
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
                  {sortedProjects.slice(0, visible).map((project) => (
                    <ProjectCard key={project.id} project={project} />
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
