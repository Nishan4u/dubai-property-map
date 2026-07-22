"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MapPin, Share2, Star, X } from "lucide-react";
import type { Project } from "@/types";
import { formatAed, getCommunity, getDeveloper } from "@/data/mock";
import { ProjectThumb } from "@/components/ui/ProjectThumb";

export function FeaturedProjectCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(true);
  const developer = getDeveloper(project.developerId);

  if (!open) return null;

  return (
    <div className="absolute right-4 top-4 z-20 w-80 overflow-hidden rounded-xl border border-navy-700 bg-navy-900 shadow-2xl">
      <div className="relative">
        <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gold-500 px-2.5 py-1 text-xs font-semibold text-navy-950">
          <Star className="h-3 w-3 fill-navy-950" /> Featured
        </span>
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-navy-950/70 text-ink-300 hover:text-ink-100"
        >
          <X className="h-4 w-4" />
        </button>
        <ProjectThumb gradient={project.gradient} className="h-40 w-full" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-ink-100">
              {project.name}
            </h3>
            <p className="text-xs text-ink-500">by {developer?.name}</p>
          </div>
          <div className="flex items-center gap-2 text-ink-500">
            <Share2 className="h-4 w-4" />
            <Heart className="h-4 w-4" />
          </div>
        </div>

        <dl className="mt-3 space-y-1.5 text-xs">
          <Row label="Starting From" value={formatAed(project.priceFromAed)} />
          <Row label="Payment Plan" value={project.paymentPlan} />
          <Row
            label="Handover"
            value={`${project.handoverQuarter} ${project.handoverYear}`}
          />
          <Row label="Property Type" value={project.propertyType} />
          <Row
            label="Location"
            value={getCommunity(project.communityId)?.name ?? ""}
            icon
          />
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
          className="mt-4 block w-full rounded-lg bg-gold-500 py-2 text-center text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          View Project
        </Link>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="rounded-lg border border-navy-600 py-2 text-xs font-medium text-ink-300 hover:text-ink-100">
            Book Viewing
          </button>
          <button className="rounded-lg border border-emerald-600/40 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10">
            WhatsApp
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs text-ink-400">
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
