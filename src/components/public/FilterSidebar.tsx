"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, ChevronRight, MapPin, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CompactSelect } from "@/components/public/CompactSelect";
import { LocationAutocomplete } from "@/components/public/LocationAutocomplete";
import { unitTypeOptions } from "@/lib/unitTypeOptions";
import type { MapViewState } from "@/lib/geoSearch";
import type { Community, Developer } from "@/types";

export interface ProjectFilters {
  location: string;
  developerId: string;
  communityId: string;
  propertyType: string;
  priceMin: string;
  priceMax: string;
  bedrooms: string;
  handoverYear: string;
  paymentPlan: string;
  offPlan: boolean;
  ready: boolean;
  /** Only meaningful alongside a Ready property -- an off-plan project has
   * no building age yet. "3" means "3 years old or newer". */
  buildingAgeMax: string;
  nearMetro: boolean;
  minInvestmentScore: string;
  escrowStatus: string;
  furnishing: string;
  completionStatus: string;
  unitType: string;
  sizeSqftMin: string;
  sizeSqftMax: string;
}

export const emptyFilters: ProjectFilters = {
  location: "",
  developerId: "",
  communityId: "",
  propertyType: "",
  priceMin: "",
  priceMax: "",
  bedrooms: "",
  handoverYear: "",
  paymentPlan: "",
  offPlan: false,
  ready: false,
  buildingAgeMax: "",
  nearMetro: false,
  minInvestmentScore: "",
  escrowStatus: "",
  furnishing: "",
  completionStatus: "",
  unitType: "",
  sizeSqftMin: "",
  sizeSqftMax: "",
};

export function FilterSidebar({
  developers,
  communities,
  propertyTypes,
  paymentPlans,
  handoverYears,
  filters,
  onApply,
  sidebarBanner,
  viewerDeveloperId = null,
  getMapView,
}: {
  developers: Developer[];
  communities: Community[];
  propertyTypes: string[];
  paymentPlans: string[];
  handoverYears: number[];
  filters: ProjectFilters;
  onApply: (filters: ProjectFilters) => void;
  sidebarBanner?: { id: string; title: string; targetUrl: string | null; developerName?: string } | null;
  /** Set for logged-in Developer/Salesperson accounts — the results are
   * already locked to this one developer, so the developer picker and the
   * other-developers directory widget are hidden rather than offered as a
   * choice that would just be a no-op (or worse, imply competitors are
   * browsable, which they aren't for these accounts). */
  viewerDeveloperId?: string | null;
  /** Save Map View: read at save-time (not a live prop) so the map's own
   * viewport/layers get bundled into the same "Save This Search" action
   * instead of a separate control. Omitted entirely outside HomeClient
   * (e.g. no map on this page) simply saves filters only, same as before. */
  getMapView?: () => MapViewState | null;
}) {
  const { currency } = useLocale();
  const [draft, setDraft] = useState<ProjectFilters>(filters);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");

  useEffect(() => setDraft(filters), [filters]);

  function set<K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleOpenSaveInput() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("idle");
    setShowSaveInput(true);
  }

  async function handleSaveSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!saveLabel.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      label: saveLabel.trim(),
      filters: draft,
      map_view: getMapView?.() ?? null,
    });
    setSaveStatus(error ? "error" : "saved");
    if (!error) {
      setShowSaveInput(false);
      setSaveLabel("");
    }
    if (!error) setTimeout(() => setSaveStatus("idle"), 2000);
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto border-navy-700 bg-navy-900 p-4 lg:w-72 lg:shrink-0 lg:border-r">
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-100">
            <SlidersHorizontal className="h-4 w-4 text-gold-400" />
            Search &amp; Filters
          </h3>
          <button
            onClick={() => {
              setDraft(emptyFilters);
              onApply(emptyFilters);
            }}
            className="text-xs font-medium text-ink-500 hover:text-ink-300"
          >
            Reset
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Location
            </label>
            <LocationAutocomplete
              value={draft.location}
              onChange={(v) => set("location", v)}
              suggestions={communities.map((c) => c.name)}
              placeholder="e.g. Dubai Marina, Business Bay…"
            />
          </div>
          {!viewerDeveloperId && (
            <CompactSelect
              label="Developer"
              placeholder="All Developers"
              value={draft.developerId}
              onChange={(v) => set("developerId", v)}
              options={developers.map((d) => ({ label: d.name, value: d.id }))}
            />
          )}
          <CompactSelect
            label="Community"
            placeholder="All Communities"
            value={draft.communityId}
            onChange={(v) => set("communityId", v)}
            options={communities.map((c) => ({ label: c.name, value: c.id }))}
          />
          <CompactSelect
            label="Property Type"
            placeholder="All Types"
            value={draft.propertyType}
            onChange={(v) => set("propertyType", v)}
            options={propertyTypes.map((t) => ({ label: t, value: t }))}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Price Range ({currency})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={draft.priceMin}
                onChange={(e) => set("priceMin", e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              <span className="text-ink-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={draft.priceMax}
                onChange={(e) => set("priceMax", e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
          </div>

          <CompactSelect
            label="Bedrooms"
            placeholder="Any"
            value={draft.bedrooms}
            onChange={(v) => set("bedrooms", v)}
            options={[
              { label: "Studio", value: "0" },
              { label: "1 BR", value: "1" },
              { label: "2 BR", value: "2" },
              { label: "3 BR", value: "3" },
              { label: "4+ BR", value: "4" },
            ]}
          />
          <CompactSelect
            label="Unit Type"
            placeholder="Any"
            value={draft.unitType}
            onChange={(v) => set("unitType", v)}
            options={unitTypeOptions.map((t) => ({ label: t, value: t }))}
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Size (Sq Ft)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={draft.sizeSqftMin}
                onChange={(e) => set("sizeSqftMin", e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              <span className="text-ink-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={draft.sizeSqftMax}
                onChange={(e) => set("sizeSqftMax", e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
          </div>
          <CompactSelect
            label="Handover Year"
            placeholder="Any"
            value={draft.handoverYear}
            onChange={(v) => set("handoverYear", v)}
            options={handoverYears.map((y) => ({ label: String(y), value: String(y) }))}
          />
          <CompactSelect
            label="Payment Plan"
            placeholder="Any"
            value={draft.paymentPlan}
            onChange={(v) => set("paymentPlan", v)}
            options={paymentPlans.map((p) => ({ label: p, value: p }))}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Property Status
            </label>
            <div className="flex items-center gap-4 text-xs text-ink-300">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draft.offPlan}
                  onChange={(e) => set("offPlan", e.target.checked)}
                  className="accent-gold-500"
                />
                Off Plan
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draft.ready}
                  onChange={(e) => set("ready", e.target.checked)}
                  className="accent-gold-500"
                />
                Ready
              </label>
            </div>
          </div>

          <CompactSelect
            label="Building Age"
            placeholder="Any"
            value={draft.buildingAgeMax}
            onChange={(v) => set("buildingAgeMax", v)}
            options={[
              { label: "Up to 1 Year", value: "1" },
              { label: "Up to 3 Years", value: "3" },
              { label: "Up to 5 Years", value: "5" },
              { label: "Up to 10 Years", value: "10" },
            ]}
          />

          <label className="flex items-center gap-1.5 text-xs text-ink-300">
            <input
              type="checkbox"
              checked={draft.nearMetro}
              onChange={(e) => set("nearMetro", e.target.checked)}
              className="accent-gold-500"
            />
            Near a Metro Station (within 1.5km)
          </label>

          <CompactSelect
            label="Investment Score"
            placeholder="Any"
            value={draft.minInvestmentScore}
            onChange={(v) => set("minInvestmentScore", v)}
            options={[
              { label: "70+", value: "70" },
              { label: "80+", value: "80" },
              { label: "90+", value: "90" },
            ]}
          />
          <CompactSelect
            label="Escrow Account"
            placeholder="All"
            value={draft.escrowStatus}
            onChange={(v) => set("escrowStatus", v)}
            options={[
              { label: "Available", value: "available" },
              { label: "Not Available", value: "not_available" },
            ]}
          />
          <CompactSelect
            label="Furnishing"
            placeholder="Any"
            value={draft.furnishing}
            onChange={(v) => set("furnishing", v)}
            options={[
              { label: "Furnished", value: "furnished" },
              { label: "Unfurnished", value: "unfurnished" },
              { label: "Semi-Furnished", value: "semi_furnished" },
            ]}
          />
          <CompactSelect
            label="Completion Status"
            placeholder="Any"
            value={draft.completionStatus}
            onChange={(v) => set("completionStatus", v)}
            options={[
              { label: "Ready to move in", value: "Ready to move in" },
              { label: "Under construction", value: "Under construction" },
              { label: "Off-plan", value: "Off-plan" },
              { label: "Future project — not yet under construction", value: "Future project — not yet under construction" },
            ]}
          />
        </div>

        <button
          onClick={() => onApply(draft)}
          className="mt-4 w-full rounded-lg bg-gold-500 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          Apply Filters
        </button>
        {showSaveInput ? (
          <form onSubmit={handleSaveSearch} className="mt-2 space-y-1.5">
            <input
              autoFocus
              required
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
              placeholder='e.g. "2BR Business Bay under 2M"'
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saveStatus === "saving"}
                className="flex-1 rounded-lg bg-gold-500 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
              >
                {saveStatus === "saving" ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveInput(false)}
                className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={handleOpenSaveInput}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-navy-600 py-2 text-xs font-medium text-ink-300 hover:text-ink-100"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            {saveStatus === "saved" ? "Saved!" : "Save This Search"}
          </button>
        )}
        {saveStatus === "error" && (
          <p className="mt-1 text-center text-xs text-rose-400">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to save searches.
          </p>
        )}
      </div>

      {!viewerDeveloperId && (
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
                  <ChevronRight className="h-3.5 w-3.5 text-ink-500" />
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
      )}

      {sidebarBanner && (
        <Link
          href={sidebarBanner.targetUrl ? `/api/ads/click/${sidebarBanner.id}` : "#"}
          className="block rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 hover:border-gold-500/50"
        >
          <p className="text-xs font-semibold text-gold-400">Sponsored</p>
          <p className="mt-1 text-sm font-medium text-ink-100">{sidebarBanner.title}</p>
          {sidebarBanner.developerName && (
            <p className="mt-0.5 text-xs text-ink-500">by {sidebarBanner.developerName}</p>
          )}
        </Link>
      )}
    </div>
  );
}

