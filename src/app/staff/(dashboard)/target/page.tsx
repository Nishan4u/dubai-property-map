import { DataTable } from "@/components/ui/DataTable";
import { getStaffSelfData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function StaffTargetPage() {
  const { staff, referrals, commissions, targets } = await getStaffSelfData();
  if (!staff) return null;

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const newSubsThisMonth = referrals.filter((r) => {
    const d = new Date(r.first_subscribed_at);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  }).length;
  const revenueThisMonth = commissions
    .filter((c) => c.period_year === year && c.period_month === month)
    .reduce((sum, c) => sum + Number(c.subscription_amount), 0);

  const target = staff.new_subscription_target || 0;
  const targetPct = target > 0 ? Math.min(Math.round((newSubsThisMonth / target) * 100), 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Monthly Target</h1>
        <p className="text-sm text-ink-400">Current month and historical performance against target.</p>
      </div>

      <div className="max-w-lg rounded-xl border border-navy-700 bg-navy-850 p-5">
        <p className="text-sm font-semibold text-ink-100">Current Month</p>
        <div className="mt-3 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-ink-500">Target</p>
            <p className="mt-1 text-lg font-bold text-ink-100">{target}</p>
          </div>
          <div>
            <p className="text-xs text-ink-500">Achieved</p>
            <p className="mt-1 text-lg font-bold text-gold-400">{newSubsThisMonth}</p>
          </div>
          <div>
            <p className="text-xs text-ink-500">Remaining</p>
            <p className="mt-1 text-lg font-bold text-ink-100">{Math.max(target - newSubsThisMonth, 0)}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-navy-800">
          <div className="h-full bg-gold-500" style={{ width: `${targetPct}%` }} />
        </div>
        <p className="mt-1 text-right text-xs text-ink-500">{targetPct}%</p>
        <div className="mt-3 grid grid-cols-2 gap-4 border-t border-navy-800 pt-3 text-center">
          <div>
            <p className="text-xs text-ink-500">Renewal Target</p>
            <p className="mt-1 text-sm font-semibold text-ink-100">{staff.renewal_target}</p>
          </div>
          <div>
            <p className="text-xs text-ink-500">Revenue Target</p>
            <p className="mt-1 text-sm font-semibold text-ink-100">
              AED {revenueThisMonth.toLocaleString()} / {Number(staff.revenue_target).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">History</h2>
        <DataTable
          columns={[
            { header: "Month", render: (t) => `${t.year}-${String(t.month).padStart(2, "0")}` },
            { header: "New Subscription Target", render: (t) => t.new_subscription_target },
            { header: "Renewal Target", render: (t) => t.renewal_target },
            { header: "Revenue Target", render: (t) => `AED ${Number(t.revenue_target).toLocaleString()}` },
          ]}
          rows={targets}
        />
        {targets.length === 0 && <p className="mt-2 text-xs text-ink-500">No target history yet.</p>}
      </div>
    </div>
  );
}
