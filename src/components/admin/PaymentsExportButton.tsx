"use client";

import { useState } from "react";
import { Download } from "lucide-react";

// Downloads the CSV directly rather than navigating to the export URL --
// a plain <a href> would work too, but this keeps the From/To values in
// sync with what's actually being requested and shows a loading state
// while Stripe's invoice list (potentially several pages) is fetched.
export function PaymentsExportButton() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/payments/export?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments-export${from ? `-${from}` : ""}${to ? `-to-${to}` : ""}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <p className="text-sm font-semibold text-ink-200">Export Payments for VAT Filing</p>
      <p className="mt-0.5 text-xs text-ink-500">
        Every Stripe, bank transfer, and wallet payment across all account types, with the VAT portion
        of each broken out (VAT is included in the price charged, not added on top).
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">From (blank = all time)</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {loading ? "Exporting…" : "Export CSV"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-rose-400">{error}</p>}
    </div>
  );
}
