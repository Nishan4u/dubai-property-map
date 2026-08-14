"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bath, BedDouble, FolderOpen, Mail, MessageCircle, Phone, Printer, Ruler } from "lucide-react";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { NearbyDistances } from "@/components/public/NearbyDistances";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { NearestPoi } from "@/lib/investmentScore";

interface PresentationUnitType {
  unitName: string;
  unitType: string;
  // null means the agent chose to hide price on this collection -- shown
  // as "Contact agent" rather than a fake/blank value, same as
  // priceFromAed below.
  startingPriceAed: number | null;
  sizeSqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  availability: string;
}

interface PresentationProject {
  // "project" (a developer project) or "brokerListing" (patch_145 --
  // one of the broker's own broker_listings) -- decides which detail
  // page a card links to and which fields below are meaningful. A
  // developer project has no bathrooms/sizeSqft/propertyType/
  // listingType/brokerName at this top level (those live inside
  // unitTypes); a broker listing has no developerName/unitTypes/
  // paymentPlanDetails (it's a single unit, not a project with
  // categories).
  kind: "project" | "brokerListing";
  name: string;
  slug: string;
  coverImageUrl: string | null;
  gradient: string;
  // null means the agent chose to hide this field on this collection --
  // shown as "Contact agent" rather than a fake/blank value.
  priceFromAed: number | null;
  bedroomsFrom: number;
  bedroomsTo: number;
  bathrooms: number | null;
  sizeSqft: number | null;
  propertyType: string | null;
  listingType: string | null;
  communityName: string | null;
  developerName: string | null;
  brokerName: string | null;
  brokerPhotoUrl: string | null;
  // All three below are additive, real-data-or-empty (never fabricated) --
  // a collection with none of this data renders exactly as it did before
  // these existed, since each section below is conditional on .length > 0.
  paymentPlanDetails: { label: string; percent: number }[];
  nearbyPoi: NearestPoi[];
  unitTypes: PresentationUnitType[];
}

interface Agent {
  name: string;
  photoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
}

// Presentation Studio 2.0 modes -- a pure client-side rendering
// directive (which of the sections below render, and in what order/
// emphasis), never four separate page templates, and never a second
// path around the hide_* stripping the API already does server-side.
// "quick_pitch" renders none of the new sections at all -- the fastest
// thing to skim on WhatsApp, and byte-for-byte what every collection
// rendered before Presentation Studio 2.0 existed.
// "luxury" (Presentation Wizard batch) leads with premium unit specs +
// lifestyle/location, and de-emphasizes payment-plan financing detail --
// a genuine differentiator from "end_user" (which leads with location
// too, but doesn't intentionally mute the payment plan), not just a
// reskin. A judgment call, easy to retune later.
type PresentationMode = "default" | "investor" | "end_user" | "quick_pitch" | "luxury";
type SectionKey = "unitTypes" | "paymentPlan" | "location";

const SECTION_ORDER: Record<PresentationMode, SectionKey[]> = {
  default: ["unitTypes", "paymentPlan", "location"],
  investor: ["unitTypes", "paymentPlan", "location"],
  end_user: ["location", "unitTypes", "paymentPlan"],
  quick_pitch: [],
  luxury: ["unitTypes", "location", "paymentPlan"],
};

// Which section(s) get full visual weight per mode -- everything else
// still renders (real data is never hidden by a mode), just muted/
// de-emphasized rather than removed.
const EMPHASIZED_SECTIONS: Record<PresentationMode, SectionKey[]> = {
  default: ["unitTypes", "paymentPlan", "location"],
  investor: ["unitTypes", "paymentPlan"],
  end_user: ["location"],
  quick_pitch: [],
  luxury: ["unitTypes", "location"],
};

// A visible mode badge in the header, so the framing reads immediately
// instead of only being a content-ordering effect a viewer might not
// consciously notice. "default" has no badge -- the plain, un-modal case
// this whole feature is additive on top of.
const MODE_LABELS: Partial<Record<PresentationMode, string>> = {
  investor: "Investor Presentation",
  end_user: "Lifestyle Presentation",
  quick_pitch: "Quick Pitch",
  luxury: "Luxury Selection",
};

export function PresentationClient({ token }: { token: string }) {
  const { formatPrice } = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<PresentationMode>("default");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [projects, setProjects] = useState<PresentationProject[]>([]);

  useEffect(() => {
    fetch(`/api/presentations/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "This link isn't valid.");
          setLoading(false);
          return;
        }
        setTitle(data.title);
        setMode((data.mode as PresentationMode) ?? "default");
        setAgent(data.agent ?? null);
        setProjects(data.projects);
        setLoading(false);
      })
      .catch(() => {
        setError("Something went wrong loading this collection.");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center text-sm text-ink-400">Loading…</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="rounded-2xl border border-rose-700/40 bg-navy-850 p-8">
          <h1 className="text-lg font-semibold text-rose-400">Link not available</h1>
          <p className="mt-2 text-sm text-ink-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Print stylesheet lives here (not globally) -- only this page is
          meant to be saved/printed as a branded PDF; every other page on
          the site keeps its normal on-screen chrome when printed. */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FolderOpen className="h-5 w-5 text-gold-400" />
          <h1 className="font-serif text-xl font-medium text-ink-100">{title}</h1>
          {MODE_LABELS[mode] && (
            <span className="rounded-full border border-gold-500/40 bg-gold-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-400">
              {MODE_LABELS[mode]}
            </span>
          )}
        </div>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
        >
          <Printer className="h-3.5 w-3.5" /> Download PDF
        </button>
      </div>

      {agent && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
          {agent.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agent.photoUrl}
              alt={agent.name}
              className="h-14 w-14 shrink-0 rounded-full border-2 border-gold-500/40 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold-500/40 bg-navy-800 text-lg font-semibold text-gold-400">
              {agent.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">Presented by</p>
            <p className="text-sm font-semibold text-ink-100">{agent.name}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-300">
              {agent.whatsapp && (
                <a
                  href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-print flex items-center gap-1 hover:text-gold-400"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )}
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="no-print flex items-center gap-1 hover:text-gold-400">
                  <Phone className="h-3.5 w-3.5" /> {agent.phone}
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="no-print flex items-center gap-1 hover:text-gold-400">
                  <Mail className="h-3.5 w-3.5" /> {agent.email}
                </a>
              )}
              {/* Print/PDF version shows plain text instead of tel:/mailto:/
                  wa.me links, which are meaningless on a printed page. */}
              <span className="hidden print:inline">
                {[agent.phone, agent.whatsapp && `WhatsApp ${agent.whatsapp}`, agent.email].filter(Boolean).join(" · ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <p className="text-sm text-ink-500">This collection has no projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            // A broker's own listing (patch_145) links to its own public
            // page, not a developer project's -- same collection, two
            // real destinations, distinguished by `kind`.
            const href = p.kind === "brokerListing" ? `/brokers/listings/${p.slug}` : `/projects/${p.slug}`;
            const listingTypeLabel =
              p.listingType === "sale" ? "For Sale" : p.listingType === "rent" ? "For Rent" : p.listingType === "lease" ? "For Lease" : null;
            return (
              <Link
                key={`${p.kind}-${p.slug}`}
                href={href}
                className="overflow-hidden rounded-xl border border-navy-700 bg-navy-850 transition-colors hover:border-gold-500/40"
              >
                <div className="relative">
                  <ProjectThumb gradient={p.gradient} imageUrl={p.coverImageUrl} imageAlt={p.name} className="h-40 w-full" />
                  {p.kind === "brokerListing" && p.propertyType && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-navy-950/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-400 backdrop-blur-sm">
                      {p.propertyType}
                      {listingTypeLabel ? ` · ${listingTypeLabel}` : ""}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-serif text-sm font-medium text-ink-100">{p.name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">
                    {p.kind === "brokerListing"
                      ? (p.communityName ?? "Location on request")
                      : `${p.developerName ? `by ${p.developerName}` : "Developer on request"}${p.communityName ? ` · ${p.communityName}` : p.developerName ? " · Location on request" : ""}`}
                  </p>
                  <p className="mt-2 font-serif text-sm italic font-semibold text-gold-400">
                    {p.priceFromAed != null
                      ? p.kind === "project"
                        ? `From ${formatPrice(p.priceFromAed)}`
                        : formatPrice(p.priceFromAed)
                      : "Contact agent for price"}
                  </p>

                  {/* Icon-accented fact row -- bed range always (both
                      kinds), bath/size only when the item actually has
                      them (a broker's own listing has real scalar
                      values; a developer project's bed/bath/size live
                      per unit type below, not at this top level). */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {p.bedroomsFrom === 0 && p.bedroomsTo === 0
                        ? "Studio"
                        : p.bedroomsTo > p.bedroomsFrom
                          ? `${p.bedroomsFrom}-${p.bedroomsTo}`
                          : p.bedroomsFrom}
                    </span>
                    {p.bathrooms != null && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" /> {p.bathrooms}
                      </span>
                    )}
                    {p.sizeSqft != null && (
                      <span className="flex items-center gap-1">
                        <Ruler className="h-3.5 w-3.5" /> {p.sizeSqft.toLocaleString()} sqft
                      </span>
                    )}
                  </div>

                  {p.kind === "brokerListing" && p.brokerName && (
                    <div className="mt-2 flex items-center gap-1.5 border-t border-navy-800 pt-2 text-xs text-ink-500">
                      {p.brokerPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.brokerPhotoUrl} alt={p.brokerName} className="h-4 w-4 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold-500/20 text-[9px] font-semibold text-gold-400">
                          {p.brokerName.charAt(0)}
                        </span>
                      )}
                      Listed by {p.brokerName}
                    </div>
                  )}

                  {SECTION_ORDER[mode].map((sectionKey) => (
                    <PresentationSection
                      key={sectionKey}
                      sectionKey={sectionKey}
                      project={p}
                      emphasized={EMPHASIZED_SECTIONS[mode].includes(sectionKey)}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// One card section per SectionKey. `emphasized` is purely a styling
// signal (full-strength vs. muted/smaller heading) -- it never hides
// real data; a de-emphasized section still shows everything a viewer
// would see in "default" mode, just visually quieter. Each branch keeps
// its own `.length > 0` guard so a project missing this specific data
// renders nothing for it, exactly like before modes existed.
function PresentationSection({
  sectionKey,
  project,
  emphasized,
  formatPrice,
}: {
  sectionKey: SectionKey;
  project: PresentationProject;
  emphasized: boolean;
  formatPrice: (amountAed: number) => string;
}) {
  // Emphasized sections get a real visual accent -- a thicker gold-
  // tinted divider and a gold heading -- not just "not muted," so a
  // mode's emphasis is something a viewer actually sees at a glance,
  // not only a content-ordering effect.
  const headingClass = emphasized
    ? "mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gold-400"
    : "mb-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-600";
  const wrapperClass = emphasized
    ? "mt-3 border-t-2 border-gold-500/40 pt-3"
    : "mt-3 border-t border-navy-800 pt-3 opacity-75";

  if (sectionKey === "unitTypes") {
    if (project.unitTypes.length === 0) return null;
    return (
      <div className={wrapperClass}>
        <p className={headingClass}>Unit Types</p>
        <div className="space-y-1">
          {project.unitTypes.map((u, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-ink-300">
                {u.unitName}
                {u.sizeSqft ? ` · ${u.sizeSqft.toLocaleString()} sqft` : ""}
              </span>
              <span className="font-medium text-ink-100">
                {u.startingPriceAed != null ? formatPrice(u.startingPriceAed) : "Contact agent"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sectionKey === "paymentPlan") {
    if (project.paymentPlanDetails.length === 0) return null;
    return (
      <div className={wrapperClass}>
        <p className={headingClass}>Payment Plan</p>
        <div className="overflow-hidden rounded-lg border border-navy-700">
          {project.paymentPlanDetails.map((stage, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-navy-800 bg-navy-900 px-2.5 py-1.5 text-xs last:border-b-0"
            >
              <span className="text-ink-300">{stage.label}</span>
              <span className="font-semibold text-gold-400">{stage.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // sectionKey === "location"
  if (project.nearbyPoi.length === 0) return null;
  return (
    <div className={wrapperClass}>
      <p className={headingClass}>Location Intelligence</p>
      <NearbyDistances items={project.nearbyPoi} />
    </div>
  );
}
