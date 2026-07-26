import { Badge } from "@/components/ui/Badge";
import type { SubscriptionBankTransferRow } from "@/types/database";

const statusLabel: Record<SubscriptionBankTransferRow["status"], string> = {
  verification_pending: "Payment Verification Pending",
  paid: "Paid",
  rejected: "Rejected",
};
const statusTone: Record<SubscriptionBankTransferRow["status"], "green" | "gold" | "red"> = {
  verification_pending: "gold",
  paid: "green",
  rejected: "red",
};

export function BankTransferHistory({ transfers }: { transfers: SubscriptionBankTransferRow[] }) {
  if (transfers.length === 0) return null;

  return (
    <div className="max-w-lg space-y-2">
      <p className="text-xs font-semibold text-ink-400">Bank Transfer History</p>
      <div className="space-y-2">
        {transfers.map((t) => (
          <div key={t.id} className="rounded-lg border border-navy-700 bg-navy-900 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-ink-300">
                  {t.plan_key} &middot; AED {t.amount_aed.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-500">
                  Submitted {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge tone={statusTone[t.status]}>{statusLabel[t.status]}</Badge>
            </div>
            {t.status === "rejected" && t.rejection_reason && (
              <p className="mt-1.5 text-xs text-rose-400">Reason: {t.rejection_reason}</p>
            )}
            <a
              href={t.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-[11px] font-medium text-gold-400 hover:underline"
            >
              View receipt
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
