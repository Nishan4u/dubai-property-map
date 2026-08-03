import { DollarSign, Landmark, TrendingUp, Wallet } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import { formatAed } from "@/data/mock";
import type { getRevenueReportAdmin } from "@/lib/supabase/queries";

export function AdminRevenueReport({ report }: { report: Awaited<ReturnType<typeof getRevenueReportAdmin>> }) {
  const { revenueTrend, overview } = report;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estimated MRR" value={formatAed(overview.estimatedMrr)} icon={TrendingUp} />
        <StatCard label="Active Subscriptions" value={overview.totalActiveSubscriptions.toLocaleString()} icon={DollarSign} />
        <StatCard label="Bank Transfers Approved" value={formatAed(overview.totalBankTransferAmount)} icon={Landmark} />
        <StatCard label="Wallet Payments" value={formatAed(overview.totalWalletPaymentAmount)} icon={Wallet} />
      </div>

      <SectionCard title="Revenue Over Time">
        {revenueTrend.length > 0 ? (
          <TrendAreaChart data={revenueTrend} dataKey="amount" color="#e3ab3d" />
        ) : (
          <p className="py-10 text-center text-sm text-ink-500">No paid revenue recorded yet.</p>
        )}
      </SectionCard>

      <p className="text-xs text-ink-500">
        This trend reflects broker/agency Stripe payments and approved bank
        transfers, the only revenue sources with a timestamped payment
        ledger. Salesperson subscriptions and developer flat fees (feature-
        project boosts, ad placements) update account status directly with
        no payment record kept, so they&apos;re only reflected in the
        current-state totals above, not the trend line.
      </p>
    </div>
  );
}
