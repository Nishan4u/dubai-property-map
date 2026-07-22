"use client";

import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { communities, formatAed } from "@/data/mock";

export default function AdminCommunitiesPage() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Communities</h1>
          <p className="text-sm text-ink-400">
            Manage master communities shown on the interactive map.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400">
          <Plus className="h-4 w-4" /> Add Community
        </button>
      </div>

      <DataTable
        columns={[
          {
            header: "Community",
            render: (c) => (
              <span className="flex items-center gap-2 font-medium text-ink-100">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.pinColor }} />
                {c.name}
              </span>
            ),
          },
          { header: "Projects", render: (c) => c.projectsCount },
          { header: "Avg. Price", render: (c) => formatAed(c.avgPriceAed) },
          { header: "Price Trend", render: (c) => `${c.priceTrendPct}%` },
          {
            header: "",
            render: () => (
              <div className="flex gap-2">
                <button className="text-xs font-medium text-gold-400 hover:text-gold-300">
                  Edit
                </button>
                <button className="text-xs font-medium text-rose-400 hover:text-rose-300">
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={communities}
      />
    </div>
  );
}
