import { getStaffSelfData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function StaffPerformancePage() {
  const { staff, referrals, commissions } = await getStaffSelfData();
  if (!staff) return null;

  const now = new Date();
  const months: { year: number; month: number }[] = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  });

  const rows = months.map(({ year, month }) => {
    const monthCommissions = commissions.filter((c) => c.period_year === year && c.period_month === month);
    const newSubs = referrals.filter((r) => {
      const d = new Date(r.first_subscribed_at);
      return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
    }).length;
    return {
      label: `${year}-${String(month).padStart(2, "0")}`,
      newSubs,
      revenue: monthCommissions.reduce((s, c) => s + Number(c.subscription_amount), 0),
      commission: monthCommissions.reduce((s, c) => s + Number(c.commission_amount), 0),
    };
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Performance</h1>
        <p className="text-sm text-ink-400">Last 6 months, based on actual paid subscriptions and commission earned.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-700">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-700 bg-navy-850 text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium">New Subscriptions</th>
              <th className="px-4 py-3 font-medium">Revenue Generated</th>
              <th className="px-4 py-3 font-medium">Commission Earned</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-navy-800 last:border-0">
                <td className="px-4 py-3 text-ink-100">{r.label}</td>
                <td className="px-4 py-3">{r.newSubs}</td>
                <td className="px-4 py-3">AED {r.revenue.toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-gold-400">AED {r.commission.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
