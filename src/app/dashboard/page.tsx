import {
  BarChart3,
  Building2,
  CalendarCheck,
  Eye,
  MessageSquare,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { TrendLineChart } from "@/components/ui/Charts";
import { developerAnalytics, projects } from "@/data/mock";

const topProjects = [...projects]
  .sort((a, b) => b.views - a.views)
  .slice(0, 5);

export default function DeveloperDashboardHome() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Dashboard</h1>
        <p className="text-sm text-ink-400">
          Welcome back — here&apos;s how your projects are performing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Projects" value="24" delta="+2 This Month" icon={Building2} />
        <StatCard label="Total Views" value="18,642" delta="+12.5%" icon={Eye} />
        <StatCard label="Total Leads" value="1,256" delta="+8.2%" icon={Users} />
        <StatCard label="Total Enquiries" value="842" delta="+6.1%" icon={MessageSquare} />
        <StatCard label="Bookings" value="312" delta="+3.4%" icon={CalendarCheck} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Project Performance" className="lg:col-span-2">
          <TrendLineChart
            data={developerAnalytics}
            lines={[
              { key: "views", color: "#a855f7", label: "Views" },
              { key: "leads", color: "#38bdf8", label: "Leads" },
            ]}
          />
        </SectionCard>

        <SectionCard
          title={
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-100">
              <BarChart3 className="h-4 w-4 text-gold-400" />
              Top Performing Projects
            </h3>
          }
        >
          <ul className="space-y-3">
            {topProjects.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-200">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: ["#22c55e", "#eab308", "#3b82f6", "#a855f7", "#f97316"][i],
                    }}
                  />
                  {p.name}
                </span>
                <span className="flex gap-3 text-xs text-ink-500">
                  <span>{p.views.toLocaleString()} views</span>
                  <span>{p.leads} leads</span>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
