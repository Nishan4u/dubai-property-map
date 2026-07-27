"use client";

import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Filter, Heart, Search, X } from "lucide-react";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { formatAed } from "@/data/mock";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import type { ListingType, Project } from "@/types";

const tabs: { label: string; value: ListingType }[] = [
  { label: "Buy", value: "buy" },
  { label: "Rent", value: "rent" },
  { label: "Off Plan", value: "off-plan" },
  { label: "Ready", value: "ready" },
];

export function SiteHeader({
  activeTab,
  onTabChange,
  onFiltersClick,
  activeFilterCount,
  searchQuery,
  onSearchChange,
  navLinks = defaultSecondaryLinks,
  searchResults,
  onSelectResult,
  searchDisabled = false,
}: {
  activeTab: ListingType;
  onTabChange: (v: ListingType) => void;
  onFiltersClick?: () => void;
  activeFilterCount?: number;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  navLinks?: { label: string; url: string }[];
  searchResults?: Project[];
  onSelectResult?: (project: Project) => void;
  /** Set when the viewer doesn't have Map access — the search box is shown
   * (so the layout doesn't jump) but visually locked and inert, since
   * search is one of the "protected" interactive Map features. */
  searchDisabled?: boolean;
}) {
  const showResults = !searchDisabled && !!searchQuery?.trim() && !!searchResults;

  return (
    <div className="border-b border-navy-700 bg-navy-900">
    <header className="flex flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center">
        <Image
          src="/logo/dubai-property-map-logo.png"
          alt="Dubai Property Map"
          width={883}
          height={237}
          priority
          className="h-8 w-auto sm:h-9"
        />
      </Link>

      <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[180px] sm:flex-1 md:min-w-[240px]">
        <div
          className={clsx(
            "flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2",
            searchDisabled && "pointer-events-none select-none opacity-40 blur-[1px]"
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-ink-500" />
          <input
            value={searchDisabled ? "" : (searchQuery ?? "")}
            onChange={(e) => onSearchChange?.(e.target.value)}
            disabled={searchDisabled}
            className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            placeholder="Search projects, communities or developers..."
          />
          {!searchDisabled && searchQuery && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSearchChange?.("")}
              className="shrink-0 text-ink-500 hover:text-ink-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {showResults && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-lg border border-navy-700 bg-navy-900 shadow-2xl">
            {searchResults!.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ink-500">
                No projects match &quot;{searchQuery}&quot;.
              </p>
            ) : (
              searchResults!.slice(0, 8).map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectResult?.(project)}
                  className="flex w-full items-center gap-3 border-b border-navy-800 px-3 py-2 text-left last:border-b-0 hover:bg-navy-800"
                >
                  <ProjectThumb
                    gradient={project.gradient}
                    imageUrl={project.coverImageUrl}
                    className="h-10 w-10 shrink-0 rounded-lg"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-100">
                      {project.name}
                    </span>
                    <span className="block truncate text-xs text-ink-500">
                      {project.communityName}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-gold-400">
                    {formatAed(project.priceFromAed)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-lg bg-navy-850 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={clsx(
              "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
              activeTab === tab.value
                ? "bg-gold-500 text-navy-950"
                : "text-ink-300 hover:text-ink-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <button
        onClick={onFiltersClick}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-navy-700 px-2.5 py-2 text-sm font-medium text-ink-300 hover:text-ink-100 sm:px-3"
      >
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {!!activeFilterCount && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-xs font-semibold text-navy-950">
            {activeFilterCount}
          </span>
        )}
      </button>

      <Link
        href="/favorites"
        className="hidden shrink-0 items-center justify-center rounded-lg border border-navy-700 p-2 text-ink-300 hover:text-ink-100 sm:flex"
      >
        <Heart className="h-4 w-4" />
      </Link>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <AuthStatus />
      </div>
    </header>
    <nav className="flex items-center gap-5 overflow-x-auto border-t border-navy-800/80 px-3 py-2 text-xs font-medium text-ink-400 sm:px-6">
      {navLinks.map((link) => (
        <Link
          key={link.url}
          href={link.url}
          className="shrink-0 hover:text-ink-100"
        >
          {link.label}
        </Link>
      ))}
    </nav>
    </div>
  );
}

const defaultSecondaryLinks = [
  { label: "Developers", url: "/developers" },
  { label: "Communities", url: "/communities" },
  { label: "New Launches", url: "/?tag=new-launch" },
  { label: "Blog", url: "/blog" },
  { label: "Advertise", url: "/advertise" },
];
