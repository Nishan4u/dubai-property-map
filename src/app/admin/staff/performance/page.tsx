import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getStaffPerformanceAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

type RangeKey = "today" | "this_week" | "this_month" | "previous_month" | "custom";

const rangeLabels: Record<RangeKey, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  previous_month: "Previous Month",
  custom: "Custom",
};

function resolveRange(range: RangeKey, fromParam?: string, toParam?: string) {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const endOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

  if (range === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }
  if (range === "this_week") {
    const day = now.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diffToMonday);
    return { from: startOfDay(monday), to: endOfDay(now) };
  }
  if (range === "this_month") {
    return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), to: endOfDay(now) };
  }
  if (range === "previous_month") {
    const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
    const firstOfPrevMonth = new Date(Date.UTC(lastOfPrevMonth.getUTCFullYear(), lastOfPrevMonth.getUTCMonth(), 1));
    return { from: firstOfPrevMonth, to: endOfDay(lastOfPrevMonth) };
  }
  // custom
  const from = fromParam ? startOfDay(new Date(fromParam)) : startOfDay(now);
  const to = toParam ? endOfDay(new Date(toParam)) : endOfDay(now);
  return { from, to };
}

export default async function AdminStaffPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = (["today", "this_week", "this_month", "previous_month", "custom"].includes(params.range ?? "")
    ? params.range
    : "this_month") as RangeKey;
  const { from, to } = resolveRange(range, params.from, params.to);

  const performance = await getStaffPerformanceAdmin(from.toISOString(), to.toISOString());
  const leaderboard = [...performance].sort((a, b) => b.commissionEarned - a.commissionEarned).slice(0, 10);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Staff Performance</h1>
        <p className="text-sm text-ink-400">
          {from.toLocaleDateString()} – {to.toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(rangeLabels) as RangeKey[])
          .filter((r) => r !== "custom")
          .map((r) => (
            <Link
              key={r}
              href={`/admin/staff/performance?range=${r}`}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-medium",
                range === r ? "bg-gold-500 text-navy-950" : "border border-navy-600 text-ink-300 hover:text-ink-100"
              )}
            >
              {rangeLabels[r]}
            </Link>
          ))}
        <form className="flex items-center gap-2" action="/admin/staff/performance">
          <input type="hidden" name="range" value="custom" />
          <input
            type="date"
            name="from"
            defaultValue={range === "custom" ? params.from : undefined}
            className="rounded-lg border border-navy-600 bg-navy-800 px-2 py-1.5 text-xs text-ink-100 focus:outline-none"
          />
          <span className="text-xs text-ink-500">to</span>
          <input
            type="date"
            name="to"
            defaultValue={range === "custom" ? params.to : undefined}
            className="rounded-lg border border-navy-600 bg-navy-800 px-2 py-1.5 text-xs text-ink-100 focus:outline-none"
          />
          <button
            type="submit"
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              range === "custom" ? "bg-gold-500 text-navy-950" : "border border-navy-600 text-ink-300 hover:text-ink-100"
            )}
          >
            Apply
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Leaderboard</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leaderboard.map((p, i) => (
            <div key={p.staff.id} className="flex items-center gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
              <span
                className={clsx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  i === 0 ? "bg-gold-500 text-navy-950" : "bg-navy-700 text-ink-300"
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-100">{p.staff.full_name}</p>
                <p className="text-xs text-ink-500">{p.newSubscriptions} new · AED {p.commissionEarned.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        {leaderboard.length === 0 && <p className="text-xs text-ink-500">No staff activity in this range yet.</p>}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Full Breakdown</h2>
        <DataTable
          columns={[
            { header: "Staff", render: (p) => <span className="font-medium text-ink-100">{p.staff.full_name}</span> },
            { header: "Referral Code", render: (p) => <span className="font-mono text-xs text-gold-400">{p.staff.referral_code}</span> },
            { header: "Target", render: (p) => p.target },
            { header: "Achieved", render: (p) => p.achieved },
            { header: "Remaining", render: (p) => p.remaining },
            { header: "Target %", render: (p) => <Badge tone={p.targetPct >= 100 ? "green" : "gold"}>{p.targetPct}%</Badge> },
            { header: "New Subs", render: (p) => p.newSubscriptions },
            { header: "Renewals", render: (p) => p.renewals },
            { header: "Active", render: (p) => p.activeSubscribers },
            { header: "Expired", render: (p) => p.expiredSubscribers },
            { header: "Revenue", render: (p) => `AED ${p.revenue.toLocaleString()}` },
            { header: "Commission Earned", render: (p) => `AED ${p.commissionEarned.toLocaleString()}` },
            { header: "Pending", render: (p) => `AED ${p.pending.toLocaleString()}` },
            { header: "Approved", render: (p) => `AED ${p.approved.toLocaleString()}` },
            { header: "Paid", render: (p) => `AED ${p.paid.toLocaleString()}` },
          ]}
          rows={performance.map((p) => ({ ...p, id: p.staff.id }))}
        />
      </div>
    </div>
  );
}
