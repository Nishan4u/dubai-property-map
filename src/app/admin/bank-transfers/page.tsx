import { Landmark } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { BankTransferActions } from "@/components/admin/BankTransferActions";
import { createClient } from "@/lib/supabase/server";
import { getAllBankTransfersAdmin } from "@/lib/supabase/queries";
import type { SubscriptionBankTransferRow } from "@/types/database";

export const dynamic = "force-dynamic";

const statusLabel: Record<SubscriptionBankTransferRow["status"], string> = {
  verification_pending: "Verification Pending",
  paid: "Paid",
  rejected: "Rejected",
};
const statusTone: Record<SubscriptionBankTransferRow["status"], "green" | "gold" | "red"> = {
  verification_pending: "gold",
  paid: "green",
  rejected: "red",
};

type Row = SubscriptionBankTransferRow & {
  developers: { name: string } | null;
  brokers: { full_name: string } | null;
  salespersons: { full_name: string } | null;
  brokerages: { name: string } | null;
  receiptSignedUrl: string | null;
};

export default async function AdminBankTransfersPage() {
  const supabase = await createClient();
  const rows = await getAllBankTransfersAdmin();

  const withSignedUrls: Row[] = await Promise.all(
    rows.map(async (r) => {
      const { data } = await supabase.storage
        .from("payment-receipts")
        .createSignedUrl(r.receipt_url, 3600);
      return { ...r, receiptSignedUrl: data?.signedUrl ?? null };
    })
  );

  const pendingCount = withSignedUrls.filter((r) => r.status === "verification_pending").length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Landmark className="h-5 w-5 text-gold-400" /> Bank Transfer Payments
        </h1>
        <p className="text-sm text-ink-400">
          Review manual bank transfer receipts for developer, broker,
          salesperson, and broker agency subscriptions. Approving activates
          the subscription — rejecting leaves it inactive.
          {pendingCount > 0 && (
            <> <span className="text-gold-400">{pendingCount} awaiting review.</span></>
          )}
        </p>
      </div>

      <DataTable<Row>
        columns={[
          {
            header: "Account",
            render: (r) => (
              <div>
                <p className="font-medium text-ink-100">
                  {r.developers?.name ?? r.brokers?.full_name ?? r.salespersons?.full_name ?? r.brokerages?.name ?? "—"}
                </p>
                <p className="text-xs text-ink-500 capitalize">{r.account_type}</p>
              </div>
            ),
          },
          { header: "Plan", render: (r) => <span className="text-ink-200">{r.plan_key}</span> },
          {
            header: "Amount",
            render: (r) => <span className="text-ink-200">AED {r.amount_aed.toLocaleString()}</span>,
          },
          {
            header: "Receipt",
            render: (r) =>
              r.receiptSignedUrl ? (
                <a
                  href={r.receiptSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-sky-400 hover:underline"
                >
                  View Receipt
                </a>
              ) : (
                <span className="text-xs text-ink-500">Unavailable</span>
              ),
          },
          {
            header: "Reference",
            render: (r) => <span className="text-xs text-ink-400">{r.transaction_reference ?? "—"}</span>,
          },
          {
            header: "Submitted",
            render: (r) => (
              <span className="text-xs text-ink-400">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            ),
          },
          {
            header: "Status",
            render: (r) => (
              <div>
                <Badge tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge>
                {r.status === "rejected" && r.rejection_reason && (
                  <p className="mt-1 text-xs text-rose-400">{r.rejection_reason}</p>
                )}
              </div>
            ),
          },
          {
            header: "Actions",
            render: (r) =>
              r.status === "verification_pending" ? (
                <BankTransferActions id={r.id} />
              ) : (
                <span className="text-xs text-ink-500">
                  Reviewed {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : ""}
                </span>
              ),
          },
        ]}
        rows={withSignedUrls}
      />
    </div>
  );
}
