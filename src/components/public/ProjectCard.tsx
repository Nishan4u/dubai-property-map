"use client";

import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import { Heart } from "lucide-react";
import type { Project } from "@/types";
import { formatAed, getDeveloper, getCommunity } from "@/data/mock";
import { ProjectThumb } from "@/components/ui/ProjectThumb";

export function ProjectCard({ project }: { project: Project }) {
  const [saved, setSaved] = useState(false);
  const developer = getDeveloper(project.developerId);
  const community = getCommunity(project.communityId);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex gap-3 rounded-xl border border-navy-700 bg-navy-850 p-3 transition-colors hover:border-gold-500/40"
    >
      <ProjectThumb
        gradient={project.gradient}
        className="h-24 w-28 shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate text-sm font-semibold text-ink-100 group-hover:text-gold-400">
            {project.name}
          </h4>
          <button
            onClick={(e) => {
              e.preventDefault();
              setSaved((s) => !s);
            }}
            className="shrink-0 text-ink-500 hover:text-rose-400"
          >
            <Heart
              className={clsx("h-4 w-4", saved && "fill-rose-500 text-rose-500")}
            />
          </button>
        </div>
        <p className="truncate text-xs text-ink-500">by {developer?.name}</p>
        <p className="truncate text-xs text-ink-500">{community?.name}</p>
        <p className="mt-1 text-sm font-semibold text-gold-400">
          From {formatAed(project.priceFromAed)}
        </p>
        <p className="mt-0.5 text-xs text-ink-400">
          {project.bedroomsFrom === 0 ? "Studio" : `${project.bedroomsFrom}`}
          {project.bedroomsTo > project.bedroomsFrom
            ? ` - ${project.bedroomsTo} BR`
            : project.bedroomsFrom > 0
              ? " BR"
              : ""}{" "}
          · Handover {project.handoverQuarter} {project.handoverYear}
        </p>
      </div>
    </Link>
  );
}
