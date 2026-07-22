"use client";

import { useState } from "react";
import type { Project } from "@/types";
import { ProjectCard } from "./ProjectCard";

const sortOptions = ["Featured", "Newest", "Lowest Price", "Highest Price", "ROI", "Handover"];

export function ProjectListPanel({ projects }: { projects: Project[] }) {
  const [visible, setVisible] = useState(6);
  const [sort, setSort] = useState(sortOptions[0]);

  return (
    <div className="flex h-full w-96 shrink-0 flex-col border-r border-navy-700 bg-navy-900">
      <div className="flex items-center justify-between border-b border-navy-700 px-4 py-3">
        <h3 className="text-sm font-semibold text-ink-100">
          {projects.length} Projects Found
        </h3>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-800 px-2 py-1 text-xs text-ink-300 focus:outline-none"
        >
          {sortOptions.map((opt) => (
            <option key={opt}>Sort: {opt}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {projects.slice(0, visible).map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {visible < projects.length && (
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
