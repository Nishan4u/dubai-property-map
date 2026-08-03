import { SectionCard } from "@/components/ui/SectionCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import type {
  getAllBookingsAdmin,
  getAllBrochureDownloadsAdmin,
  getAllDevelopersAdmin,
  getAllLeadsAdmin,
  getAllProjectEventsAdmin,
  getAllProjectsAdmin,
  getCommunities,
} from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";
import { getInvestmentScore } from "@/lib/investmentScore";

// Byte-identical relocation of what was previously the entire content of
// /admin/reports/page.tsx -- now the "Overview" tab, unchanged, just fed
// via props instead of an inline await so the page can also fetch the
// newer report datasets (Revenue, Subscriptions, Sales, People, Activity)
// in parallel and hand them to their own tabs.
export function AdminReportsOverview({
  developers,
  projectRows,
  communities,
  leads,
  bookings,
  events,
  downloads,
}: {
  developers: Awaited<ReturnType<typeof getAllDevelopersAdmin>>;
  projectRows: Awaited<ReturnType<typeof getAllProjectsAdmin>>;
  communities: Awaited<ReturnType<typeof getCommunities>>;
  leads: Awaited<ReturnType<typeof getAllLeadsAdmin>>;
  bookings: Awaited<ReturnType<typeof getAllBookingsAdmin>>;
  events: Awaited<ReturnType<typeof getAllProjectEventsAdmin>>;
  downloads: Awaited<ReturnType<typeof getAllBrochureDownloadsAdmin>>;
}) {
  const projects = projectRows;

  const topDevelopers = developers
    .map((d) => ({ ...d, count: projects.filter((p) => p.developer_id === d.id).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const mostViewed = [...projects].sort((a, b) => b.views - a.views).slice(0, 5);

  const popularCommunities = communities
    .map((c) => ({ ...c, count: projects.filter((p) => p.community_id === c.id).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const highestRoi = projects
    .map((p) => ({ ...p, score: getInvestmentScore(mapProject(p)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const eventCounts = { click: 0, whatsapp: 0, phone: 0, map_click: 0 };
  for (const e of events) {
    if (e.event_type in eventCounts) {
      eventCounts[e.event_type as keyof typeof eventCounts] += 1;
    }
  }

  const downloadsByProject = new Map<string, { name: string; count: number }>();
  for (const d of downloads) {
    const projectInfo = Array.isArray(d.projects) ? d.projects[0] : d.projects;
    const name = projectInfo?.name ?? "Unknown";
    const entry = downloadsByProject.get(d.project_id) ?? { name, count: 0 };
    entry.count += 1;
    downloadsByProject.set(d.project_id, entry);
  }
  const topDownloads = Array.from(downloadsByProject.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const bookingsByStatus = { confirmed: 0, completed: 0, cancelled: 0 };
  for (const b of bookings) {
    if (b.status in bookingsByStatus) {
      bookingsByStatus[b.status as keyof typeof bookingsByStatus] += 1;
    }
  }

  const leadsByDate = new Map<string, number>();
  for (const l of leads) {
    const date = new Date(l.created_at).toLocaleDateString("en-GB", {
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
    <div className="space-y-6">
      <SectionCard title="Platform Leads Over Time">
        {leadsTrend.length > 0 ? (
          <TrendAreaChart data={leadsTrend} dataKey="leads" color="#e3ab3d" />
        ) : (
          <p className="py-10 text-center text-sm text-ink-500">No leads yet.</p>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReportList
          title="Top Developers"
          items={topDevelopers.map((d) => `${d.name} — ${d.count} projects`)}
        />
        <ReportList
          title="Most Viewed Projects"
          items={mostViewed.map((p) => `${p.name} — ${p.views.toLocaleString()} views`)}
        />
        <ReportList
          title="Popular Communities"
          items={popularCommunities.map((c) => `${c.name} — ${c.count} projects`)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReportList
          title="Highest Investment Score"
          items={highestRoi.map((p) => `${p.name} — ${p.score}/100`)}
        />
        <ReportList
          title="Most Downloaded Brochures"
          items={topDownloads.map((d) => `${d.name} — ${d.count} downloads`)}
        />
        <SectionCard title="Traffic & Bookings">
          <ul className="space-y-1.5 text-sm text-ink-300">
            <li>Clicks: {eventCounts.click}</li>
            <li>WhatsApp clicks: {eventCounts.whatsapp}</li>
            <li>Phone clicks: {eventCounts.phone}</li>
            <li>Map pin clicks: {eventCounts.map_click}</li>
            <li className="mt-2 border-t border-navy-800 pt-2">
              Bookings confirmed: {bookingsByStatus.confirmed}
            </li>
            <li>Bookings completed: {bookingsByStatus.completed}</li>
            <li>Bookings cancelled: {bookingsByStatus.cancelled}</li>
          </ul>
        </SectionCard>
      </div>
      <p className="text-xs text-ink-500">
        Investment Score is a transparent computed metric (rating, review
        volume, and the &quot;high-roi&quot; tag) — not a fabricated market
        statistic. See the Investment Score filter on the homepage for the
        same formula.
      </p>
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
        {items.length === 0 && <li className="text-ink-500">No data yet.</li>}
      </ol>
    </SectionCard>
  );
}
