import {
  Building2,
  ClipboardList,
  MessageSquare,
  Users,
  UserCog,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart, TrendLineChart } from "@/components/ui/Charts";
import { developers, platformLeadsAnalytics, adminActivity } from "@/data/mock";

const topDevelopers = [...developers]
  .sort((a, b) => b.projectsCount - a.projectsCount)
  .slice(0, 3);

export default function AdminDashboardHome() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Dashboard</h1>
        <p className="text-sm text-ink-400">
          Platform-wide overview across all developers and projects.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Developers" value="156" delta="+6 This Month" icon={Building2} />
        <StatCard label="Total Projects" value="2,341" delta="+28 This Month" icon={ClipboardList} />
        <StatCard label="Total Leads" value="12,842" delta="+15.3%" icon={Users} />
        <StatCard label="Total Enquiries" value="8,754" delta="+11.2%" icon={MessageSquare} />
        <StatCard label="Total Users" value="24,591" delta="+9.4%" icon={UserCog} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Projects Overview">
          <DonutChart
            data={[
              { name: "Off Plan (53%)", value: 1245, color: "#3b82f6" },
              { name: "Ready (29%)", value: 684, color: "#22c55e" },
              { name: "Under Construction (18%)", value: 412, color: "#a855f7" },
            ]}
          />
        </SectionCard>
        <SectionCard title="Leads Overview" action={<span className="text-xs text-ink-500">This Month</span>}>
          <TrendLineChart
            data={platformLeadsAnalytics}
            lines={[{ key: "leads", color: "#22c55e", label: "Leads" }]}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Recent Activities">
          <ul className="space-y-3">
            {adminActivity.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                <div>
                  <p className="text-ink-200">{a.text}</p>
                  <p className="text-xs text-ink-500">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title={
            <h3 className="text-sm font-semibold text-ink-100">Top Developers</h3>
          }
          action={<span className="text-xs font-medium text-gold-400">View All</span>}
        >
          <ul className="space-y-3">
            {topDevelopers.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-200">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: d.color }}
                  >
                    {d.initial}
                  </span>
                  {d.name}
                </span>
                <span className="text-xs text-ink-500">
                  {d.projectsCount} Projects · {d.rating}★
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Traffic Sources">
          <DonutChart
            data={[
              { name: "Direct", value: 22500, color: "#3b82f6" },
              { name: "Organic Search", value: 15000, color: "#22c55e" },
              { name: "Social Media", value: 7500, color: "#f97316" },
              { name: "Referral", value: 5000, color: "#a855f7" },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
