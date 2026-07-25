import { Building2, CalendarCheck, ClipboardList, UserCog, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { DonutChart } from "@/components/ui/Charts";
import { createClient } from "@/lib/supabase/server";
import {
  getAllDevelopersAdmin,
  getAllLeadsAdmin,
  getAllProjectsAdmin,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboardHome() {
  const supabase = await createClient();
  const [developers, projects, leads, { count: userCount }, { data: bookings }] =
    await Promise.all([
      getAllDevelopersAdmin(),
      getAllProjectsAdmin(),
      getAllLeadsAdmin(),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id"),
    ]);

  const approvalCounts = { approved: 0, pending: 0, review: 0, rejected: 0 };
  for (const p of projects) approvalCounts[p.approval_status]++;

  const sourceCounts = new Map<string, number>();
  for (const l of leads) {
    sourceCounts.set(l.source, (sourceCounts.get(l.source) ?? 0) + 1);
  }
  const sourceColors = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#eab308"];
  const sourceData = Array.from(sourceCounts.entries()).map(([name, value], i) => ({
    name,
    value,
    color: sourceColors[i % sourceColors.length],
  }));

  const topDevelopers = [...developers]
    .map((d) => ({ ...d, count: projects.filter((p) => p.developer_id === d.id).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentActivity = [
    ...projects.map((p) => ({
      text: `Project "${p.name}" ${p.approval_status === "pending" ? "submitted for review" : "updated"}`,
      time: p.created_at,
    })),
    ...developers.map((d) => ({ text: `Developer "${d.name}" registered`, time: d.created_at })),
    ...leads.slice(0, 5).map((l) => ({
      text: `New lead from ${l.projects?.name ?? "a project"}`,
      time: l.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Dashboard</h1>
        <p className="text-sm text-ink-400">
          Platform-wide overview across all developers and projects.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Developers" value={String(developers.length)} icon={Building2} />
        <StatCard label="Total Projects" value={String(projects.length)} icon={ClipboardList} />
        <StatCard label="Total Leads" value={String(leads.length)} icon={Users} />
        <StatCard label="Total Bookings" value={String(bookings?.length ?? 0)} icon={CalendarCheck} />
        <StatCard label="Total Users" value={String(userCount ?? 0)} icon={UserCog} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Projects by Approval Status">
          <DonutChart
            data={[
              { name: "Approved", value: approvalCounts.approved, color: "#22c55e" },
              { name: "Pending", value: approvalCounts.pending, color: "#eab308" },
              { name: "Review", value: approvalCounts.review, color: "#3b82f6" },
              { name: "Rejected", value: approvalCounts.rejected, color: "#ef4444" },
            ]}
          />
        </SectionCard>
        <SectionCard title="Lead Sources">
          {sourceData.length > 0 ? (
            <DonutChart data={sourceData} />
          ) : (
            <p className="py-10 text-center text-sm text-ink-500">No leads yet.</p>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Recent Activity">
          <ul className="space-y-3">
            {recentActivity.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                <div>
                  <p className="text-ink-200">{a.text}</p>
                  <p className="text-xs text-ink-500">
                    {new Date(a.time).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-ink-500">No activity yet.</p>
            )}
          </ul>
        </SectionCard>

        <SectionCard
          title={<h3 className="text-sm font-semibold text-ink-100">Top Developers</h3>}
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
                <span className="text-xs text-ink-500">{d.count} Projects</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
