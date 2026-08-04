"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Heart } from "lucide-react";
import type { Project } from "@/types";
import { getDeveloper, getCommunity } from "@/data/mock";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { useFavorites } from "@/components/auth/FavoritesProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ShareButton } from "@/components/public/ShareButton";

export function ProjectCard({
  project,
  onSelect,
}: {
  project: Project;
  onSelect?: (project: Project) => void;
}) {
  const router = useRouter();
  const { formatPrice } = useLocale();
  const { favoriteIds, toggle } = useFavorites();
  const saved = favoriteIds.has(project.id);
  const developerName = project.developerName ?? getDeveloper(project.developerId)?.name;
  const communityName = project.communityName ?? getCommunity(project.communityId)?.name;

  return (
    <Link
      href={`/projects/${project.slug}`}
      onClick={(e) => {
        if (!onSelect) return;
        e.preventDefault();
        onSelect(project);
      }}
      className="group flex gap-3 rounded-xl border border-navy-700 bg-navy-850 p-3 transition-colors hover:border-gold-500/40"
    >
      <ProjectThumb
        gradient={project.gradient}
        imageUrl={project.coverImageUrl}
        logoUrl={project.logoUrl ?? project.developerLogoUrl}
        logoSize="lg"
        className="h-24 w-28 shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate text-sm font-semibold text-ink-100 group-hover:text-gold-400">
            {project.name}
          </h4>
          <div className="flex shrink-0 items-center">
            <ShareButton
              targetType="project"
              targetId={project.id}
              title={project.name}
              path={`/projects/${project.slug}`}
              compact
            />
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const result = await toggle(project.id);
                if (result === "needs-login") router.push("/login");
              }}
              className="text-ink-500 hover:text-rose-400"
            >
              <Heart
                className={clsx("h-4 w-4", saved && "fill-rose-500 text-rose-500")}
              />
            </button>
          </div>
        </div>
        <p className="truncate text-sm font-medium text-ink-200">by {developerName}</p>
        <p className="truncate text-xs text-ink-500">{communityName}</p>
        <p className="mt-1 text-sm font-semibold text-gold-400">
          From {formatPrice(project.priceFromAed)}
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
        {project.paymentPlan && (
          <p className="mt-0.5 truncate text-xs text-ink-400">
            Payment Plan: <span className="font-medium text-ink-300">{project.paymentPlan}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
