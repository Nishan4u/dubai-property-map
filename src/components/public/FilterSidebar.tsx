"use client";

import Link from "next/link";
import { ChevronRight, MapPin, SlidersHorizontal } from "lucide-react";
import { developers } from "@/data/mock";

export function FilterSidebar() {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-navy-700 bg-navy-900 p-4">
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-100">
            <SlidersHorizontal className="h-4 w-4 text-gold-400" />
            Search &amp; Filters
          </h3>
          <button className="text-xs font-medium text-ink-500 hover:text-ink-300">
            Reset
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Field label="Developer" placeholder="All Developers" />
          <Field label="Community" placeholder="All Communities" />
          <Field label="Property Type" placeholder="All Types" />

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Price Range (AED)
            </label>
            <div className="flex items-center gap-2">
              <input
                placeholder="Min"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              <span className="text-ink-500">-</span>
              <input
                placeholder="Max"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
          </div>

          <Field label="Bedrooms" placeholder="Any" />
          <Field label="Handover Year" placeholder="Any" />
          <Field label="Payment Plan" placeholder="Any" />

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Property Status
            </label>
            <div className="flex items-center gap-4 text-xs text-ink-300">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="accent-gold-500" /> Off Plan
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="accent-gold-500" /> Ready
              </label>
            </div>
          </div>
        </div>

        <button className="mt-4 w-full rounded-lg bg-gold-500 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400">
          Apply Filters
        </button>
        <button className="mt-2 w-full rounded-lg border border-navy-600 py-2 text-sm font-medium text-ink-300 hover:text-ink-100">
          Save Search
        </button>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-100">Top Developers</h3>
          <Link
            href="/developers"
            className="text-xs font-medium text-gold-400 hover:text-gold-300"
          >
            View All
          </Link>
        </div>
        <ul className="space-y-1">
          {developers.slice(0, 5).map((dev) => (
            <li key={dev.id}>
              <Link
                href={`/developers/${dev.slug}`}
                className="flex items-center justify-between rounded-lg px-1.5 py-1.5 text-sm hover:bg-navy-800"
              >
                <span className="flex items-center gap-2 text-ink-200">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: dev.color }}
                  />
                  {dev.name}
                </span>
                <span className="flex items-center gap-1 text-xs text-ink-500">
                  {dev.projectsCount} Projects
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/developers"
          className="mt-2 flex items-center gap-1 px-1.5 text-xs font-medium text-ink-500 hover:text-ink-300"
        >
          <MapPin className="h-3.5 w-3.5" /> + More
        </Link>
      </div>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">
        {label}
      </label>
      <select className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-300 focus:outline-none">
        <option>{placeholder}</option>
      </select>
    </div>
  );
}
