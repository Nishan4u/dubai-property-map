"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { Filter, Heart, Search } from "lucide-react";
import type { ListingType } from "@/types";

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
}: {
  activeTab: ListingType;
  onTabChange: (v: ListingType) => void;
  onFiltersClick?: () => void;
  activeFilterCount?: number;
}) {
  return (
    <div className="border-b border-navy-700 bg-navy-900">
    <header className="flex items-center gap-4 px-6 py-3">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500 text-navy-950 font-bold">
          D
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-ink-100">Dubai</div>
          <div className="text-[10px] font-medium tracking-widest text-gold-400">
            PROPERTY MAP
          </div>
        </div>
      </Link>

      <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 lg:flex">
        <Search className="h-4 w-4 shrink-0 text-ink-500" />
        <input
          className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          placeholder="Search projects, communities or developers..."
        />
      </div>

      <div className="hidden shrink-0 items-center gap-1 rounded-lg bg-navy-850 p-1 md:flex">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={clsx(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
        className="hidden shrink-0 items-center gap-2 rounded-lg border border-navy-700 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100 lg:flex"
      >
        <Filter className="h-4 w-4" />
        Filters
        {!!activeFilterCount && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-xs font-semibold text-navy-950">
            {activeFilterCount}
          </span>
        )}
      </button>

      <Link
        href="/favorites"
        className="hidden shrink-0 items-center justify-center rounded-lg border border-navy-700 p-2 text-ink-300 hover:text-ink-100 lg:flex"
      >
        <Heart className="h-4 w-4" />
      </Link>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg border border-navy-700 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
        >
          Login / Register
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          List Your Property
        </Link>
      </div>
    </header>
    <nav className="flex items-center gap-5 overflow-x-auto border-t border-navy-800/80 px-6 py-2 text-xs font-medium text-ink-400">
      {secondaryLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="shrink-0 hover:text-ink-100"
        >
          {link.label}
        </Link>
      ))}
    </nav>
    </div>
  );
}

const secondaryLinks = [
  { label: "Developers", href: "/developers" },
  { label: "Communities", href: "/communities" },
  { label: "New Launches", href: "/?tag=new-launch" },
  { label: "Blog", href: "/blog" },
  { label: "Advertise", href: "/advertise" },
];
