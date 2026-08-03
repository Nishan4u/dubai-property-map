import { Search, SearchX } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { TrendAreaChart, DonutChart } from "@/components/ui/Charts";
import type { getSearchAnalyticsAdmin } from "@/lib/supabase/queries";

const sourceColor: Record<string, string> = {
  "Projects List": "#e3ab3d",
  Map: "#60a5fa",
  Communities: "#34d399",
  "Global Header": "#a78bfa",
};

export function AdminSearchAnalytics({ report }: { report: Awaited<ReturnType<typeof getSearchAnalyticsAdmin>> }) {
  const { totalSearches, zeroResultSearches, topQueries, bySource, searchesTrend } = report;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total Searches" value={totalSearches.toLocaleString()} icon={Search} />
        <StatCard label="Zero-Result Searches" value={zeroResultSearches.toLocaleString()} icon={SearchX} />
      </div>

      <SectionCard title="Searches Over Time">
        {searchesTrend.length > 0 ? (
          <TrendAreaChart data={searchesTrend} dataKey="searches" color="#60a5fa" />
        ) : (
          <p className="py-10 text-center text-sm text-ink-500">No searches logged yet.</p>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Top Search Terms">
          <ol className="space-y-2 text-sm text-ink-300">
            {topQueries.map((q, i) => (
              <li key={q.query} className="flex justify-between gap-2">
                <span className="flex gap-2 truncate">
                  <span className="text-gold-400">{i + 1}.</span> {q.query}
                </span>
                <span className="shrink-0 text-ink-400">{q.count}</span>
              </li>
            ))}
            {topQueries.length === 0 && <li className="text-ink-500">No data yet.</li>}
          </ol>
        </SectionCard>

        <SectionCard title="Searches by Source">
          {bySource.length > 0 ? (
            <DonutChart data={bySource.map((s) => ({ ...s, color: sourceColor[s.name] ?? "#626e8e" }))} />
          ) : (
            <p className="py-6 text-center text-sm text-ink-500">No data yet.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
