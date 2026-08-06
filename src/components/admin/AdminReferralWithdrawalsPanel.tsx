"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";

interface WithdrawalRow {
  id: string;
  account_type: string;
  amount_aed: number;
  bank_account_name: string;
  bank_name: string;
  bank_iban: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  brokers: { full_name: string } | { full_name: string }[] | null;
  salespersons: { full_name: string } | { full_name: string }[] | null;
}

const statusTone = { pending: "gold", paid: "green", rejected: "red" } as const;

function accountName(row: WithdrawalRow): string {
  const broker = Array.isArray(row.brokers) ? row.brokers[0] : row.brokers;
  const salesperson = Array.isArray(row.salespersons) ? row.salespersons[0] : row.salespersons;
  return broker?.full_name ?? salesperson?.full_name ?? "—";
}

export function AdminReferralWithdrawalsPanel({ rows }: { rows: WithdrawalRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleReview(id: string, action: "approve" | "reject") {
    let reason = "";
    if (action === "reject") {
      const input = window.prompt("Reason for rejecting this withdrawal (optional):");
      if (input === null) return; // cancelled
      reason = input;
    } else if (!window.confirm("Mark this withdrawal as paid? This deducts the amount from the referrer's wallet.")) {
      return;
    }

    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/referral-program/withdrawals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoadingId(null);
    }
  }

  const pending = rows.filter((r) => r.status === "pending");
  const reviewed = rows.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-200">Pending Withdrawal Requests</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-ink-500">No pending withdrawal requests.</p>
        ) : (
          <DataTable<WithdrawalRow>
            columns={[
              { header: "Account", render: (r) => <span className="font-medium text-ink-100">{accountName(r)}</span> },
              { header: "Type", render: (r) => <span className="capitalize text-ink-300">{r.account_type}</span> },
              { header: "Amount", render: (r) => <span className="font-semibold text-gold-400">AED {Number(r.amount_aed).toLocaleString()}</span> },
              {
                header: "Bank Details",
                render: (r) => (
                  <div className="text-xs text-ink-400">
                    <p>{r.bank_account_name}</p>
                    <p>
                      {r.bank_name} · {r.bank_iban}
                    </p>
                  </div>
                ),
              },
              { header: "Requested", render: (r) => new Date(r.created_at).toLocaleDateString() },
              {
                header: "",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReview(r.id, "approve")}
                      disabled={loadingId === r.id}
                      className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => handleReview(r.id, "reject")}
                      disabled={loadingId === r.id}
                      className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/25 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ),
              },
            ]}
            rows={pending}
          />
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-200">Reviewed</h3>
        {reviewed.length === 0 ? (
          <p className="text-sm text-ink-500">No reviewed withdrawal requests yet.</p>
        ) : (
          <DataTable<WithdrawalRow>
            columns={[
              { header: "Account", render: (r) => <span className="font-medium text-ink-100">{accountName(r)}</span> },
              { header: "Type", render: (r) => <span className="capitalize text-ink-300">{r.account_type}</span> },
              { header: "Amount", render: (r) => `AED ${Number(r.amount_aed).toLocaleString()}` },
              { header: "Status", render: (r) => <Badge tone={statusTone[r.status as keyof typeof statusTone] ?? "neutral"}>{r.status}</Badge> },
              { header: "Reason", render: (r) => <span className="text-xs text-ink-400">{r.rejection_reason ?? "—"}</span> },
              { header: "Requested", render: (r) => new Date(r.created_at).toLocaleDateString() },
            ]}
            rows={reviewed}
          />
        )}
      </div>
    </div>
  );
}
