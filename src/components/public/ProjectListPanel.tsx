"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/types";
import { ProjectCard } from "./ProjectCard";
import { CompactSelect } from "./CompactSelect";

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

export function ProjectListPanel({
  projects,
  onSelectProject,
}: {
  projects: Project[];
  onSelectProject?: (project: Project) => void;
}) {
  const [visible, setVisible] = useState(6);
  const [sort, setSort] = useState<SortOption>("Featured");

  const sortedProjects = useMemo(() => sortProjects(projects, sort), [projects, sort]);

  return (
    <div className="flex h-full w-full flex-col border-navy-700 bg-navy-900 lg:w-96 lg:shrink-0 lg:border-r">
      <div className="flex items-center justify-between border-b border-navy-700 px-4 py-3">
        <h3 className="text-sm font-semibold text-ink-100">
          {projects.length} Projects Found
        </h3>
        <CompactSelect
          label="Sort"
          hideLabel
          allowClear={false}
          placeholder="Sort"
          value={sort}
          onChange={(v) => {
            setSort((v || "Featured") as SortOption);
            setVisible(6);
          }}
          options={sortOptions.map((opt) => ({ label: `Sort: ${opt}`, value: opt }))}
          className="w-40"
        />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {sortedProjects.slice(0, visible).map((project) => (
          <ProjectCard key={project.id} project={project} onSelect={onSelectProject} />
        ))}
        {visible < sortedProjects.length && (
          <button
            onClick={() => setVisible((v) => v + 6)}
            className="w-full rounded-lg border border-navy-700 py-2 text-sm font-medium text-ink-300 hover:border-gold-500/40 hover:text-gold-400"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
