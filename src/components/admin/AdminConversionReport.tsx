import { Eye, Handshake, MousePointerClick, UserPlus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import { DataTable } from "@/components/ui/DataTable";
import { formatAed } from "@/data/mock";
import type { getAdPlacementPerformanceAdmin, getConversionFunnelAdmin } from "@/lib/supabase/queries";

export function AdminConversionReport({
  funnel,
  adPerformance,
}: {
  funnel: Awaited<ReturnType<typeof getConversionFunnelAdmin>>;
  adPerformance: Awaited<ReturnType<typeof getAdPlacementPerformanceAdmin>>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Project Views" value={funnel.totalViews.toLocaleString()} icon={Eye} />
        <StatCard label="Clicks" value={funnel.totalClicks.toLocaleString()} icon={MousePointerClick} />
        <StatCard label="Leads" value={funnel.totalLeads.toLocaleString()} icon={UserPlus} />
        <StatCard
          label="Signed Deals"
          value={`${funnel.totalSignedDeals.toLocaleString()} (${formatAed(funnel.totalSignedValue)})`}
          icon={Handshake}
        />
      </div>
      <p className="text-xs text-ink-500">
        Views is a current running total (this platform doesn&apos;t
        timestamp individual page views, only a counter), so it can&apos;t
        be trended over time below — everything else is a real,
        timestamped event.
      </p>

      <SectionCard title="Signed Deals Over Time">
        {funnel.signedDealsTrend.length > 0 ? (
          <TrendAreaChart data={funnel.signedDealsTrend} dataKey="value" color="#34d399" />
        ) : (
          <p className="py-10 text-center text-sm text-ink-500">No signed reservations yet.</p>
        )}
      </SectionCard>

      <SectionCard title="Ad Placement Performance">
        {adPerformance.length > 0 ? (
          <DataTable
            columns={[
              { header: "Placement", render: (p: (typeof adPerformance)[number]) => p.title },
              { header: "Type", render: (p) => p.placementType.replace(/_/g, " ") },
              { header: "Status", render: (p) => p.status },
              { header: "Clicks", render: (p) => p.clicks.toLocaleString() },
            ]}
            rows={adPerformance}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-500">No ad placements yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
