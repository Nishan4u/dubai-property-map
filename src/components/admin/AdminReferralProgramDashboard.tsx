import { SectionCard } from "@/components/ui/SectionCard";

interface Stats {
  totalReferralCodes: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalCashbackPaid: number;
  totalWalletBalances: number;
  totalDiscountGiven: number;
  conversionRate: number;
  topReferrers: { accountType: string; accountId: string; count: number; name: string; referralCode: string }[];
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink-100">{value}</p>
    </div>
  );
}

export function AdminReferralProgramDashboard({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Referral Codes" value={stats.totalReferralCodes.toLocaleString()} />
        <StatCard label="Successful Referrals" value={stats.successfulReferrals.toLocaleString()} />
        <StatCard label="Pending Referrals" value={stats.pendingReferrals.toLocaleString()} />
        <StatCard label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} />
        <StatCard label="Total Cashback Paid" value={`AED ${stats.totalCashbackPaid.toLocaleString()}`} />
        <StatCard label="Total Wallet Balances" value={`AED ${stats.totalWalletBalances.toLocaleString()}`} />
        <StatCard label="Total Discount Given" value={`AED ${stats.totalDiscountGiven.toLocaleString()}`} />
      </div>

      <SectionCard title="Top Referrers">
        {stats.topReferrers.length === 0 ? (
          <p className="text-sm text-ink-500">No completed referrals yet.</p>
        ) : (
          <div className="space-y-1.5">
            {stats.topReferrers.map((r) => (
              <div
                key={`${r.accountType}-${r.accountId}`}
                className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm"
              >
                <span className="text-ink-200">
                  {r.name} <span className="text-xs capitalize text-ink-500">({r.accountType})</span>{" "}
                  <span className="text-xs text-ink-500">{r.referralCode}</span>
                </span>
                <span className="font-semibold text-gold-400">
                  {r.count} referral{r.count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
