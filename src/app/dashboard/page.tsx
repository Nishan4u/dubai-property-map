import { BarChart3, Building2, CalendarCheck, Download, Eye, Percent, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import { formatAed } from "@/data/mock";
import {
  getBookingsForDeveloper,
  getBrochureDownloadsForDeveloper,
  getLeadsForDeveloper,
  getProjectsForDeveloper,
  requireDeveloperProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperDashboardHome() {
  const profile = await requireDeveloperProfile();
  const developerId = profile.developer_id;

  const [projects, leads, bookings, brochureDownloads] = await Promise.all([
    getProjectsForDeveloper(developerId),
    getLeadsForDeveloper(developerId),
    getBookingsForDeveloper(developerId),
    getBrochureDownloadsForDeveloper(developerId),
  ]);

  const totalViews = projects.reduce((sum, p) => sum + p.views, 0);
  const leadsByProject = new Map<string, number>();
  for (const lead of leads) {
    leadsByProject.set(
      lead.project_id,
      (leadsByProject.get(lead.project_id) ?? 0) + 1
    );
  }

  const wonLeads = leads.filter((l) => l.status === "won");
  const conversionRate =
    leads.length > 0 ? ((wonLeads.length / leads.length) * 100).toFixed(1) : "0.0";
  const pipelineValue = wonLeads.reduce(
    (sum, l) => sum + (l.projects?.price_from_aed ?? 0),
    0
  );

  const leadsByDate = new Map<string, number>();
  for (const lead of leads) {
    const date = new Date(lead.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    leadsByDate.set(date, (leadsByDate.get(date) ?? 0) + 1);
  }
  const leadsTrend = Array.from(leadsByDate.entries()).map(([date, leads]) => ({
    date,
    leads,
  }));

  const topProjects = [...projects].sort((a, b) => b.views - a.views).slice(0, 5);
  const colors = ["#22c55e", "#eab308", "#3b82f6", "#a855f7", "#f97316"];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Dashboard</h1>
        <p className="text-sm text-ink-400">
          Welcome back — here&apos;s how your projects are performing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Projects" value={String(projects.length)} icon={Building2} />
        <StatCard label="Total Views" value={totalViews.toLocaleString()} icon={Eye} />
        <StatCard label="Total Leads" value={String(leads.length)} icon={Users} />
        <StatCard label="Bookings" value={String(bookings.length)} icon={CalendarCheck} />
        <StatCard
          label="Brochure Downloads"
          value={String(brochureDownloads.length)}
          icon={Download}
        />
        <StatCard label="Lead → Won Rate" value={`${conversionRate}%`} icon={Percent} />
        <StatCard
          label="Pipeline Value (Won)"
          value={pipelineValue > 0 ? formatAed(pipelineValue) : "—"}
          icon={BarChart3}
        />
      </div>
      {wonLeads.length > 0 && (
        <p className="-mt-3 text-xs text-ink-600">
          Pipeline Value is the starting price of projects tied to leads marked
          &quot;won&quot; — not confirmed sales revenue.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Leads Over Time" className="lg:col-span-2">
          {leadsTrend.length > 0 ? (
            <TrendAreaChart data={leadsTrend} dataKey="leads" color="#38bdf8" />
          ) : (
            <p className="py-16 text-center text-sm text-ink-500">
              No leads yet — once buyers enquire on your projects, activity
              will show up here.
            </p>
          )}
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
                    style={{ background: colors[i % colors.length] }}
                  />
                  {p.name}
                </span>
                <span className="flex gap-3 text-xs text-ink-500">
                  <span>{p.views.toLocaleString()} views</span>
                  <span>{leadsByProject.get(p.id) ?? 0} leads</span>
                </span>
              </li>
            ))}
            {topProjects.length === 0 && (
              <p className="text-sm text-ink-500">
                Add your first project to see performance here.
              </p>
            )}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
