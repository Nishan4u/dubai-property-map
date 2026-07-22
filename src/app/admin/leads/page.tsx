"use client";

import { Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { leads } from "@/data/mock";
import type { Lead } from "@/types";

const statusTone: Record<Lead["status"], "gold" | "blue" | "green" | "neutral" | "red"> = {
  new: "gold",
  contacted: "blue",
  qualified: "green",
  won: "green",
  lost: "red",
};

export default function AdminLeadsPage() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">All Leads</h1>
          <p className="text-sm text-ink-400">
            Aggregated leads across every developer on the platform.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <DataTable<Lead>
        columns={[
          { header: "Name", render: (l) => <span className="font-medium text-ink-100">{l.name}</span> },
          { header: "Country", render: (l) => l.country },
          { header: "Project", render: (l) => l.projectName },
          { header: "Source", render: (l) => l.source },
          { header: "Status", render: (l) => <Badge tone={statusTone[l.status]}>{l.status}</Badge> },
          { header: "Date", render: (l) => l.date },
        ]}
        rows={leads}
      />
    </div>
  );
}
