"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { DeleteProjectButton } from "@/components/admin/DeleteProjectButton";
import type { Project, ProjectStatus } from "@/types";

const tabs: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Featured", value: "featured" },
  { label: "Expired", value: "expired" },
  { label: "Rejected", value: "rejected" },
  { label: "Archived", value: "archived" },
];

const statusTone: Record<ProjectStatus, "green" | "gold" | "neutral" | "red"> = {
  draft: "neutral",
  published: "green",
  featured: "gold",
  expired: "neutral",
  rejected: "red",
  archived: "neutral",
};

export function DeveloperProjectsTable({ projects }: { projects: Project[] }) {
  const [tab, setTab] = useState<ProjectStatus | "all">("all");
  const filtered =
    tab === "all" ? projects : projects.filter((p) => p.status === tab);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              tab === t.value
                ? "bg-gold-500 text-navy-950"
                : "border border-navy-700 text-ink-300 hover:text-ink-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          {
            header: "Project",
            render: (p) => (
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="font-medium text-ink-100 hover:text-gold-400"
              >
                {p.name}
              </Link>
            ),
          },
          { header: "Type", render: (p) => p.propertyType },
          { header: "Price From", render: (p) => `AED ${p.priceFromAed.toLocaleString()}` },
          {
            header: "Status",
            render: (p) => <Badge tone={statusTone[p.status]}>{p.status}</Badge>,
          },
          { header: "Views", render: (p) => p.views.toLocaleString() },
          {
            header: "",
            render: (p) => (
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/projects/${p.id}`}
                  className="text-xs font-medium text-gold-400 hover:text-gold-300"
                >
                  Edit →
                </Link>
                <DeleteProjectButton projectId={p.id} projectName={p.name} />
              </div>
            ),
          },
        ]}
        rows={filtered}
      />
    </>
  );
}
