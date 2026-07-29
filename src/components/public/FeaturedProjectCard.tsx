"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, Heart, MapPin, Share2, Star, X } from "lucide-react";
import type { Project } from "@/types";
import { formatAed, getCommunity, getDeveloper } from "@/data/mock";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { useFavorites } from "@/components/auth/FavoritesProvider";
import { trackProjectEvent } from "@/lib/trackEvent";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export function FeaturedProjectCard({
  project,
  total = 1,
  index = 0,
  onExpandChange,
}: {
  project: Project;
  total?: number;
  index?: number;
  onExpandChange?: (expanded: boolean) => void;
}) {
  const router = useRouter();
  const { favoriteIds, toggle } = useFavorites();
  const saved = favoriteIds.has(project.id);
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  function setExpandedAndNotify(next: boolean) {
    setExpanded(next);
    onExpandChange?.(next);
  }
  const developerName = project.developerName ?? getDeveloper(project.developerId)?.name;
  const communityName = project.communityName ?? getCommunity(project.communityId)?.name ?? "";

  async function handleShare() {
    const url = `${window.location.origin}/projects/${project.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  // Collapsed by default so it doesn't sit on top of map pins — expands to
  // the full details card only when the user taps it.
  if (!expanded) {
    return (
      <div className="absolute right-2 top-2 z-20 sm:right-4 sm:top-4">
        <button
          onClick={() => setExpandedAndNotify(true)}
          className="flex w-48 items-center gap-2 rounded-xl border border-navy-700 bg-navy-900 p-2 text-left shadow-2xl hover:border-gold-500/40"
        >
          <ProjectThumb
            gradient={project.gradient}
            imageUrl={project.coverImageUrl}
            logoUrl={project.logoUrl ?? project.developerLogoUrl}
            logoSize="sm"
            className="h-10 w-10 shrink-0 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gold-400">
              <Star className="h-2.5 w-2.5 fill-gold-400" /> Featured
            </span>
            <p className="truncate text-xs font-semibold text-ink-100">{project.name}</p>
            <p className="text-[10px] text-ink-500">{formatAed(project.priceFromAed)}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 -rotate-90 text-ink-500" />
        </button>
        <button
          onClick={() => setOpen(false)}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy-950 text-ink-400 hover:text-ink-100"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-2 top-2 z-20 w-52 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-navy-700 bg-navy-900 shadow-2xl sm:right-4 sm:top-4 sm:w-72">
      <div className="relative">
        <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-semibold text-navy-950 sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
          <Star className="h-2.5 w-2.5 fill-navy-950 sm:h-3 sm:w-3" /> Featured
        </span>
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 sm:right-3 sm:top-3">
          <button
            onClick={() => setExpandedAndNotify(false)}
            title="Minimize"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-950/70 text-ink-300 hover:text-ink-100 sm:h-7 sm:w-7"
          >
            <ChevronDown className="h-3.5 w-3.5 rotate-90 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            title="Dismiss"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-950/70 text-ink-300 hover:text-ink-100 sm:h-7 sm:w-7"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
        <ProjectThumb
          gradient={project.gradient}
          imageUrl={project.coverImageUrl}
          logoUrl={project.logoUrl ?? project.developerLogoUrl}
          className="h-20 w-full sm:h-32"
        />
        {total > 1 && (
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={clsx(
                  "h-1.5 w-1.5 rounded-full",
                  i === index ? "bg-gold-400" : "bg-white/30"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-ink-100 sm:text-sm">
              {project.name}
            </h3>
            <p className="text-[10px] text-ink-500">by {developerName}</p>
          </div>
          <div className="flex items-center gap-2 text-ink-500">
            <button
              onClick={handleShare}
              className="relative hover:text-ink-200"
              title="Copy link"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied && (
                <span className="absolute -top-7 right-0 whitespace-nowrap rounded bg-navy-950 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  Link copied
                </span>
              )}
            </button>
            <button
              onClick={async () => {
                const result = await toggle(project.id);
                if (result === "needs-login") router.push("/login");
              }}
            >
              <Heart className={clsx("h-3.5 w-3.5", saved && "fill-rose-500 text-rose-500")} />
            </button>
          </div>
        </div>

        <dl className="mt-2 space-y-1 text-[10px] sm:text-xs">
          <Row label="Starting From" value={formatAed(project.priceFromAed)} />
          <Row
            label="Handover"
            value={`${project.handoverQuarter} ${project.handoverYear}`}
          />
          <Row label="Location" value={communityName} icon />
          <Row
            label="Bedrooms"
            value={
              project.bedroomsFrom === project.bedroomsTo
                ? `${project.bedroomsFrom} BR`
                : `${project.bedroomsFrom} - ${project.bedroomsTo} BR`
            }
          />
        </dl>

        <Link
          href={`/projects/${project.slug}`}
          onClick={() => trackProjectEvent(project.id, "click")}
          className="mt-2 block w-full rounded-lg bg-gold-500 py-1.5 text-center text-xs font-semibold text-navy-950 hover:bg-gold-400"
        >
          View Project
        </Link>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <Link
            href={`/projects/${project.slug}?enquire=viewing`}
            className="rounded-lg border border-navy-600 py-1.5 text-center text-[10px] font-medium text-ink-300 hover:text-ink-100"
          >
            Book Viewing
          </Link>
          {project.developerPhone ? (
            <a
              href={getWhatsAppUrl(
                project.developerPhone,
                `Hi, I'm interested in ${project.name}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackProjectEvent(project.id, "whatsapp")}
              className="rounded-lg border border-emerald-600/40 py-1.5 text-center text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/10"
            >
              WhatsApp
            </a>
          ) : (
            <Link
              href={`/projects/${project.slug}?enquire=general`}
              className="rounded-lg border border-emerald-600/40 py-1.5 text-center text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/10"
            >
              WhatsApp
            </Link>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1 text-[10px] text-ink-400 sm:text-xs">
          <Stars rating={project.rating} />
          <span className="text-ink-300">{project.rating}</span>
          <span>({project.reviews} Reviews)</span>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-1 text-ink-500">
        {icon && <MapPin className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="font-medium text-ink-200">{value}</dd>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.round(rating)
              ? "fill-gold-400 text-gold-400"
              : "text-navy-600"
          }`}
        />
      ))}
    </div>
  );
}
