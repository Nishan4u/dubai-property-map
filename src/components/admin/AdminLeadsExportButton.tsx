"use client";

import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/exportCsv";

interface LeadExportRow {
  name: string;
  country: string | null;
  source: string;
  status: string;
  created_at: string;
  projects?: { name: string } | null;
}

export function AdminLeadsExportButton({ leads }: { leads: LeadExportRow[] }) {
  function handleExport() {
    downloadCsv(
      `all-leads-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Country", "Project", "Source", "Status", "Date"],
      leads.map((l) => [
        l.name,
        l.country ?? "",
        l.projects?.name ?? "",
        l.source,
        l.status,
        new Date(l.created_at).toLocaleDateString(),
      ])
    );
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
    >
      <Download className="h-4 w-4" /> Export
    </button>
  );
}
