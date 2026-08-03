import { SectionCard } from "@/components/ui/SectionCard";
import { DataTable } from "@/components/ui/DataTable";
import { formatAed } from "@/data/mock";
import type {
  getAgencyAnalyticsAdmin,
  getAllDevelopersAdmin,
  getAllLeadsAdmin,
  getAllProjectsAdmin,
  getBrokerAnalyticsAdmin,
} from "@/lib/supabase/queries";

export function AdminPeopleAnalytics({
  developers,
  projectRows,
  leads,
  brokerStats,
  agencyStats,
}: {
  developers: Awaited<ReturnType<typeof getAllDevelopersAdmin>>;
  projectRows: Awaited<ReturnType<typeof getAllProjectsAdmin>>;
  leads: Awaited<ReturnType<typeof getAllLeadsAdmin>>;
  brokerStats: Awaited<ReturnType<typeof getBrokerAnalyticsAdmin>>;
  agencyStats: Awaited<ReturnType<typeof getAgencyAnalyticsAdmin>>;
}) {
  const developerStats = developers
    .map((d) => {
      const devProjects = projectRows.filter((p) => p.developer_id === d.id);
      const projectIds = new Set(devProjects.map((p) => p.id));
      return {
        id: d.id,
        name: d.name,
        projectCount: devProjects.length,
        totalViews: devProjects.reduce((sum, p) => sum + p.views, 0),
        totalLeads: leads.filter((l) => projectIds.has(l.project_id)).length,
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews);

  return (
    <div className="space-y-6">
      <SectionCard title="Developer Analytics">
        {developerStats.length > 0 ? (
          <DataTable
            columns={[
              { header: "Developer", render: (d: (typeof developerStats)[number]) => d.name },
              { header: "Projects", render: (d) => d.projectCount },
              { header: "Views", render: (d) => d.totalViews.toLocaleString() },
              { header: "Leads", render: (d) => d.totalLeads },
            ]}
            rows={developerStats}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-500">No developers yet.</p>
        )}
      </SectionCard>

      <SectionCard title="Broker Analytics">
        {brokerStats.length > 0 ? (
          <DataTable
            columns={[
              { header: "Broker", render: (b: (typeof brokerStats)[number]) => b.full_name },
              { header: "Agency", render: (b) => b.brokerageName ?? "—" },
              { header: "Clients", render: (b) => b.clientCount },
              { header: "Leads", render: (b) => b.leadCount },
              { header: "Deals Signed", render: (b) => b.salesCount },
              { header: "Deal Value", render: (b) => formatAed(b.salesValue) },
            ]}
            rows={brokerStats}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-500">No brokers yet.</p>
        )}
      </SectionCard>

      <SectionCard title="Agency Analytics">
        {agencyStats.length > 0 ? (
          <DataTable
            columns={[
              { header: "Agency", render: (a: (typeof agencyStats)[number]) => a.name },
              { header: "Brokers", render: (a) => a.brokerCount },
              { header: "Clients", render: (a) => a.clientCount },
              { header: "Leads", render: (a) => a.leadCount },
              { header: "Deals Signed", render: (a) => a.salesCount },
              { header: "Deal Value", render: (a) => formatAed(a.salesValue) },
            ]}
            rows={agencyStats}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-500">No agencies yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
