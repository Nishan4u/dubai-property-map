"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { createClient } from "@/lib/supabase/client";
import { CompactSelect } from "@/components/public/CompactSelect";
import type { DbLeadStatus } from "@/types/database";

interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  country: string | null;
  budget_aed: number | null;
  status: string;
  source: string;
  created_at: string;
  assigned_agent: string | null;
  projects?: { name: string } | null;
}

const statusTone: Record<DbLeadStatus, "gold" | "blue" | "green" | "neutral" | "red"> = {
  new: "gold",
  contacted: "blue",
  qualified: "green",
  won: "green",
  lost: "red",
};

function downloadCsv(rows: LeadRow[]) {
  const headers = ["Name", "Phone", "Country", "Budget (AED)", "Project", "Status", "Agent", "Source", "Date"];
  const lines = rows.map((l) =>
    [
      l.name,
      l.phone ?? "",
      l.country ?? "",
      l.budget_aed ?? "",
      l.projects?.name ?? "",
      l.status,
      l.assigned_agent ?? "",
      l.source,
      new Date(l.created_at).toLocaleDateString(),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadsTableClient({
  leads,
  agents,
}: {
  leads: LeadRow[];
  agents: { name: string }[];
}) {
  const [rows, setRows] = useState(leads);

  async function updateAgent(id: string, agent: string) {
    setRows((prev) => prev.map((l) => (l.id === id ? { ...l, assigned_agent: agent } : l)));
    const supabase = createClient();
    await supabase
      .from("leads")
      .update({ assigned_agent: agent || null })
      .eq("id", id);
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Leads</h1>
          <p className="text-sm text-ink-400">
            {rows.length} leads captured across your projects.
          </p>
        </div>
        <button
          onClick={() => downloadCsv(rows)}
          className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
        >
          <Download className="h-4 w-4" /> Export Excel
        </button>
      </div>

      <DataTable
        columns={[
          { header: "Name", render: (l) => <span className="font-medium text-ink-100">{l.name}</span> },
          { header: "Phone", render: (l) => l.phone ?? "—" },
          { header: "Country", render: (l) => l.country ?? "—" },
          { header: "Budget", render: (l) => (l.budget_aed ? `AED ${l.budget_aed.toLocaleString()}` : "—") },
          { header: "Project", render: (l) => l.projects?.name ?? "—" },
          { header: "Status", render: (l) => <Badge tone={statusTone[l.status as DbLeadStatus]}>{l.status}</Badge> },
          {
            header: "Agent",
            render: (l) => (
              <CompactSelect
                label="Agent"
                hideLabel
                placeholder="Unassigned"
                value={l.assigned_agent ?? ""}
                onChange={(v) => updateAgent(l.id, v)}
                options={agents.map((a) => ({ label: a.name, value: a.name }))}
              />
            ),
          },
          { header: "Source", render: (l) => l.source },
          { header: "Date", render: (l) => new Date(l.created_at).toLocaleDateString() },
        ]}
        rows={rows}
      />
    </div>
  );
}
