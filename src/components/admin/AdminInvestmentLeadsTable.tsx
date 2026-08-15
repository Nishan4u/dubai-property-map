"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import { CompactSelect } from "@/components/public/CompactSelect";
import { createClient } from "@/lib/supabase/client";

interface InvestmentLeadRow {
  id: string;
  purpose: string | null;
  budget_min: number | null;
  budget_max: number | null;
  purchase_timeline: string | null;
  full_name: string;
  email: string;
  whatsapp: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
  communities?: { name: string } | null;
}

const STATUS_OPTIONS = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Converted", value: "converted" },
  { label: "Closed", value: "closed" },
];

const statusTone: Record<string, "gold" | "blue" | "green" | "neutral"> = {
  new: "gold",
  contacted: "blue",
  converted: "green",
  closed: "neutral",
};

function formatBudget(min: number | null, max: number | null) {
  if (min == null && max == null) return "—";
  if (max == null) return `AED ${min!.toLocaleString()}+`;
  if (min === 0) return `Under AED ${max.toLocaleString()}`;
  return `AED ${min!.toLocaleString()} – ${max.toLocaleString()}`;
}

export function AdminInvestmentLeadsTable({ leads }: { leads: InvestmentLeadRow[] }) {
  const [rows, setRows] = useState(leads);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setRows((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    const supabase = createClient();
    await supabase.from("investment_leads").update({ status }).eq("id", id);
  }

  async function updateAssignedTo(id: string, assignedTo: string) {
    setRows((prev) => prev.map((l) => (l.id === id ? { ...l, assigned_to: assignedTo } : l)));
    setSavingId(id);
    const supabase = createClient();
    await supabase
      .from("investment_leads")
      .update({ assigned_to: assignedTo || null })
      .eq("id", id);
    setSavingId(null);
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Investment Report Leads</h1>
        <p className="text-sm text-ink-400">
          {rows.length} submissions from the public Investment Report quiz.
        </p>
      </div>

      <SearchableDataTable
        searchPlaceholder="Search by name or email..."
        searchFields={(l) => [l.full_name, l.email, l.whatsapp]}
        columns={[
          {
            header: "Contact",
            render: (l) => (
              <div>
                <p className="font-medium text-ink-100">{l.full_name}</p>
                <p className="text-xs text-ink-500">{l.email}</p>
              </div>
            ),
          },
          { header: "Purpose", render: (l) => (l.purpose ? l.purpose.replace("_", " ") : "—") },
          { header: "Budget", render: (l) => formatBudget(l.budget_min, l.budget_max) },
          { header: "Community", render: (l) => l.communities?.name ?? "Not sure yet" },
          { header: "Timeline", render: (l) => l.purchase_timeline ?? "—" },
          {
            header: "Status",
            render: (l) => (
              <CompactSelect
                label="Status"
                hideLabel
                allowClear={false}
                searchable={false}
                placeholder="Status"
                value={l.status}
                onChange={(v) => updateStatus(l.id, v)}
                options={STATUS_OPTIONS}
                className="w-32"
              />
            ),
          },
          {
            header: "Assigned To",
            render: (l) => (
              <input
                defaultValue={l.assigned_to ?? ""}
                onBlur={(e) => updateAssignedTo(l.id, e.target.value)}
                disabled={savingId === l.id}
                placeholder="Unassigned"
                className="w-32 rounded-lg border border-navy-600 bg-navy-800 px-2 py-1 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none disabled:opacity-50"
              />
            ),
          },
          { header: "Date", render: (l) => new Date(l.created_at).toLocaleDateString() },
        ]}
        rows={rows}
      />
      {rows.length === 0 && <p className="text-sm text-ink-500">No submissions yet.</p>}
      <p className="text-xs text-ink-500">
        <Badge tone={statusTone.new}>New</Badge> submissions aren&apos;t auto-routed to anyone — set{" "}
        <span className="font-medium text-ink-300">Assigned To</span> once you&apos;ve decided who&apos;s handling it.
      </p>
    </div>
  );
}
