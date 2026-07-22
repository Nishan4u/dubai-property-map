import { SectionCard } from "@/components/ui/SectionCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import { communities, developers, platformLeadsAnalytics, projects } from "@/data/mock";

const topDevelopers = [...developers].sort((a, b) => b.projectsCount - a.projectsCount).slice(0, 5);
const mostViewed = [...projects].sort((a, b) => b.views - a.views).slice(0, 5);
const popularCommunities = [...communities].sort((a, b) => b.projectsCount - a.projectsCount).slice(0, 5);

export default function AdminReportsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Reports</h1>
        <p className="text-sm text-ink-400">
          Platform-wide performance across developers, projects and communities.
        </p>
      </div>

      <SectionCard title="Platform Traffic">
        <TrendAreaChart data={platformLeadsAnalytics} dataKey="leads" color="#e3ab3d" />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReportList title="Top Developers" items={topDevelopers.map((d) => `${d.name} — ${d.projectsCount} projects`)} />
        <ReportList title="Most Viewed Projects" items={mostViewed.map((p) => `${p.name} — ${p.views.toLocaleString()} views`)} />
        <ReportList title="Popular Communities" items={popularCommunities.map((c) => `${c.name} — ${c.projectsCount} projects`)} />
      </div>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <SectionCard title={title}>
      <ol className="space-y-2 text-sm text-ink-300">
        {items.map((item, i) => (
          <li key={item} className="flex gap-2">
            <span className="text-gold-400">{i + 1}.</span> {item}
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
