"use client";

import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/exportCsv";

interface BrokerExportRow {
  full_name: string;
  email: string;
  mobile: string;
  account_status: string;
  verification_status: string;
  created_at: string;
  brokerages?: { name: string } | null;
}

// Spec section 9: "Export Broker reports" -- same downloadCsv() pattern
// already used by AdminLeadsExportButton.tsx.
export function AdminBrokersExportButton({ brokers }: { brokers: BrokerExportRow[] }) {
  function handleExport() {
    downloadCsv(
      `brokers-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Full Name", "Agency", "Email", "Mobile", "Account Status", "Verification", "Joined"],
      brokers.map((b) => [
        b.full_name,
        b.brokerages?.name ?? "Independent",
        b.email,
        b.mobile,
        b.account_status,
        b.verification_status,
        new Date(b.created_at).toLocaleDateString(),
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
