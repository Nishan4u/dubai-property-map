import { SectionCard } from "@/components/ui/SectionCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import type { getUserActivityReportAdmin } from "@/lib/supabase/queries";

export function AdminUserActivityReport({ report }: { report: Awaited<ReturnType<typeof getUserActivityReportAdmin>> }) {
  const { loginsTrend, signupsTrend, topUsers } = report;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Logins Over Time">
          {loginsTrend.length > 0 ? (
            <TrendAreaChart data={loginsTrend} dataKey="logins" color="#60a5fa" />
          ) : (
            <p className="py-10 text-center text-sm text-ink-500">No login history yet.</p>
          )}
        </SectionCard>
        <SectionCard title="New Signups Over Time">
          {signupsTrend.length > 0 ? (
            <TrendAreaChart data={signupsTrend} dataKey="signups" color="#e3ab3d" />
          ) : (
            <p className="py-10 text-center text-sm text-ink-500">No signups yet.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Most Active Users">
        <ol className="space-y-2 text-sm text-ink-300">
          {topUsers.map((u, i) => (
            <li key={u.email} className="flex justify-between gap-2">
              <span className="flex gap-2 truncate">
                <span className="text-gold-400">{i + 1}.</span> {u.email}
              </span>
              <span className="shrink-0 text-ink-400">{u.count} logins</span>
            </li>
          ))}
          {topUsers.length === 0 && <li className="text-ink-500">No data yet.</li>}
        </ol>
      </SectionCard>
    </div>
  );
}
