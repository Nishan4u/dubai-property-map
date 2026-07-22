"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getDeveloper, projects } from "@/data/mock";
import type { ApprovalStatus } from "@/types";

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

export default function AdminProjectsPage() {
  const [tab, setTab] = useState<ApprovalStatus | "all">("all");
  const filtered =
    tab === "all" ? projects : projects.filter((p) => p.approvalStatus === tab);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Project Approvals</h1>
        <p className="text-sm text-ink-400">
          Review new and updated project listings before they go live.
        </p>
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
          { header: "Project", render: (p) => <span className="font-medium text-ink-100">{p.name}</span> },
          { header: "Developer", render: (p) => getDeveloper(p.developerId)?.name },
          {
            header: "Approval",
            render: (p) => <Badge tone={tone[p.approvalStatus]}>{p.approvalStatus}</Badge>,
          },
          { header: "Submitted Views", render: (p) => p.views.toLocaleString() },
          {
            header: "",
            render: () => (
              <div className="flex gap-2">
                <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300">
                  Approve
                </button>
                <button className="text-xs font-medium text-rose-400 hover:text-rose-300">
                  Reject
                </button>
                <button className="text-xs font-medium text-ink-400 hover:text-ink-200">
                  Request Changes
                </button>
              </div>
            ),
          },
        ]}
        rows={filtered}
      />
    </div>
  );
}
