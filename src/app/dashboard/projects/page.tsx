"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { projects as allProjects } from "@/data/mock";
import type { ProjectStatus } from "@/types";

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

export default function DeveloperProjectsPage() {
  const [tab, setTab] = useState<ProjectStatus | "all">("all");
  const filtered =
    tab === "all" ? allProjects : allProjects.filter((p) => p.status === tab);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Projects</h1>
          <p className="text-sm text-ink-400">
            Manage all your listed developments.
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> Add Project
        </Link>
      </div>

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
          { header: "Leads", render: (p) => p.leads },
          {
            header: "",
            render: (p) => (
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="text-xs font-medium text-gold-400 hover:text-gold-300"
              >
                Edit →
              </Link>
            ),
          },
        ]}
        rows={filtered}
      />
    </div>
  );
}
