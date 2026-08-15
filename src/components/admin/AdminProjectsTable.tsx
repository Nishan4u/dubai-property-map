"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import { ProjectApprovalActions } from "@/components/admin/ProjectApprovalActions";
import { DeleteProjectButton } from "@/components/admin/DeleteProjectButton";
import { projectStatusTone } from "@/lib/adminBadgeTones";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import type { Project, ApprovalStatus } from "@/types";

const tabs: { label: string; value: ApprovalStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Review", value: "review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const tone: Record<ApprovalStatus, "gold" | "blue" | "green" | "red"> = {
  pending: "gold",
  review: "blue",
  approved: "green",
  rejected: "red",
};

export function AdminProjectsTable({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<ApprovalStatus | "all">("all");
  const filtered =
    tab === "all" ? projects : projects.filter((p) => p.approvalStatus === tab);

  async function handleDeleteSelected(ids: string[]) {
    const names = ids.map((id) => projects.find((p) => p.id === id)?.name).filter(Boolean);
    if (
      !window.confirm(
        `Delete ${ids.length} project${ids.length === 1 ? "" : "s"}? This removes each project, its unit types, reservations, favorites, and collection items. A project with an existing property request can't be deleted until that request is resolved. This cannot be undone.\n\n${names.join(", ")}`
      )
    ) {
      return;
    }
    const supabase = createClient();
    const failed: string[] = [];
    for (const id of ids) {
      const project = projects.find((p) => p.id === id);
      await logAudit("project.deleted", "project", id, { name: project?.name });
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) failed.push(project?.name ?? id);
    }
    if (failed.length > 0) {
      window.alert(
        `${failed.length} project${failed.length === 1 ? "" : "s"} couldn't be deleted (most likely an existing property request still references ${failed.length === 1 ? "it" : "them"}): ${failed.join(", ")}`
      );
    }
    router.refresh();
  }

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

      <SearchableDataTable
        searchPlaceholder="Search projects by name or developer..."
        searchFields={(p) => [p.name, p.developerName ?? ""]}
        selectable
        onDeleteSelected={handleDeleteSelected}
        columns={[
          { header: "Project", render: (p) => <span className="font-medium text-ink-100">{p.name}</span> },
          { header: "Developer", render: (p) => p.developerName ?? "—" },
          {
            header: "Status",
            render: (p) => <Badge tone={projectStatusTone[p.status]}>{p.status}</Badge>,
          },
          {
            header: "Approval",
            render: (p) => <Badge tone={tone[p.approvalStatus]}>{p.approvalStatus}</Badge>,
          },
          { header: "Views", render: (p) => p.views.toLocaleString() },
          {
            header: "",
            render: (p) => (
              <div className="flex items-center gap-3">
                <ProjectApprovalActions
                  projectId={p.id}
                  projectName={p.name}
                  developerId={p.developerId}
                  featured={p.featured}
                  featuredUntil={p.featuredUntil}
                  status={p.status}
                />
                <Link
                  href={`/admin/projects/${p.id}`}
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

