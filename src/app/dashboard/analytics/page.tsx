import { CalendarCheck, Download, Eye, MessageCircle, MousePointerClick, Percent, Phone, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import {
  getBookingsForDeveloper,
  getBrochureDownloadsForDeveloper,
  getLeadsForDeveloper,
  getProjectEventsForDeveloper,
  getProjectsForDeveloper,
  requireDeveloperProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperAnalyticsPage() {
  const profile = await requireDeveloperProfile();
  const developerId = profile.developer_id;

  const [projects, leads, bookings, brochureDownloads, events] = await Promise.all([
    getProjectsForDeveloper(developerId),
    getLeadsForDeveloper(developerId),
    getBookingsForDeveloper(developerId),
    getBrochureDownloadsForDeveloper(developerId),
    getProjectEventsForDeveloper(developerId),
  ]);

  const totalViews = projects.reduce((sum, p) => sum + p.views, 0);
  const ctr = totalViews > 0 ? ((leads.length / totalViews) * 100).toFixed(1) : "0.0";

  const eventCounts = { click: 0, whatsapp: 0, phone: 0, map_click: 0 };
  for (const e of events) {
    if (e.event_type in eventCounts) {
      eventCounts[e.event_type as keyof typeof eventCounts] += 1;
    }
  }

  const metrics = [
    { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye },
    { label: "Total Leads", value: String(leads.length), icon: Users },
    { label: "Bookings", value: String(bookings.length), icon: CalendarCheck },
    { label: "Views → Lead Rate", value: `${ctr}%`, icon: Percent },
  ];

  const engagementMetrics = [
    { label: "Clicks", value: String(eventCounts.click), icon: MousePointerClick },
    { label: "Brochure Downloads", value: String(brochureDownloads.length), icon: Download },
    { label: "WhatsApp Clicks", value: String(eventCounts.whatsapp), icon: MessageCircle },
    { label: "Phone Clicks", value: String(eventCounts.phone), icon: Phone },
    { label: "Map Pin Clicks", value: String(eventCounts.map_click), icon: MousePointerClick },
  ];

  const viewsByProject = projects
    .map((p) => ({ date: p.name.slice(0, 14), views: p.views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

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

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Analytics</h1>
        <p className="text-sm text-ink-400">
          Real engagement across all your published projects.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} icon={m.icon} />
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-100">Engagement</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {engagementMetrics.map((m) => (
            <StatCard key={m.label} label={m.label} value={m.value} icon={m.icon} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Views by Project">
          {viewsByProject.length > 0 ? (
            <TrendAreaChart data={viewsByProject} dataKey="views" color="#a855f7" />
          ) : (
            <p className="py-16 text-center text-sm text-ink-500">No projects yet.</p>
          )}
        </SectionCard>
        <SectionCard title="Leads Over Time">
          {leadsTrend.length > 0 ? (
            <TrendAreaChart data={leadsTrend} dataKey="leads" color="#38bdf8" />
          ) : (
            <p className="py-16 text-center text-sm text-ink-500">No leads yet.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
