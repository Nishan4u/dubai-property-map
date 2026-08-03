"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { AdminReportsOverview } from "@/components/admin/AdminReportsOverview";
import { AdminRevenueReport } from "@/components/admin/AdminRevenueReport";
import { AdminSubscriptionReport } from "@/components/admin/AdminSubscriptionReport";
import { AdminSalesReport } from "@/components/admin/AdminSalesReport";
import { AdminPeopleAnalytics } from "@/components/admin/AdminPeopleAnalytics";
import { AdminUserActivityReport } from "@/components/admin/AdminUserActivityReport";
import { AdminSearchAnalytics } from "@/components/admin/AdminSearchAnalytics";
import { AdminAiUsageReport } from "@/components/admin/AdminAiUsageReport";
import { AdminConversionReport } from "@/components/admin/AdminConversionReport";
import { AdminEngagementHeatmap } from "@/components/admin/AdminEngagementHeatmap";
import { SectionCard } from "@/components/ui/SectionCard";
import type { getProjectEngagementPointsAdmin } from "@/lib/supabase/queries";

const tabs = [
  "Overview",
  "Revenue",
  "Subscriptions",
  "Sales",
  "People",
  "Activity",
  "Search",
  "AI Usage",
  "Conversion",
  "Map Analytics",
] as const;
type Tab = (typeof tabs)[number];

export function AdminReportsTabs({
  overview,
  revenue,
  subscriptions,
  sales,
  people,
  activity,
  search,
  aiUsage,
  conversion,
  engagementPoints,
}: {
  overview: React.ComponentProps<typeof AdminReportsOverview>;
  revenue: React.ComponentProps<typeof AdminRevenueReport>;
  subscriptions: React.ComponentProps<typeof AdminSubscriptionReport>;
  sales: React.ComponentProps<typeof AdminSalesReport>;
  people: React.ComponentProps<typeof AdminPeopleAnalytics>;
  activity: React.ComponentProps<typeof AdminUserActivityReport>;
  search: React.ComponentProps<typeof AdminSearchAnalytics>;
  aiUsage: React.ComponentProps<typeof AdminAiUsageReport>;
  conversion: React.ComponentProps<typeof AdminConversionReport>;
  engagementPoints: Awaited<ReturnType<typeof getProjectEngagementPointsAdmin>>;
}) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-navy-850 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t ? "bg-gold-500 text-navy-950" : "text-ink-300 hover:text-ink-100"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" && <AdminReportsOverview {...overview} />}
      {tab === "Revenue" && <AdminRevenueReport {...revenue} />}
      {tab === "Subscriptions" && <AdminSubscriptionReport {...subscriptions} />}
      {tab === "Sales" && <AdminSalesReport {...sales} />}
      {tab === "People" && <AdminPeopleAnalytics {...people} />}
      {tab === "Activity" && <AdminUserActivityReport {...activity} />}
      {tab === "Search" && <AdminSearchAnalytics {...search} />}
      {tab === "AI Usage" && <AdminAiUsageReport {...aiUsage} />}
      {tab === "Conversion" && <AdminConversionReport {...conversion} />}
      {tab === "Map Analytics" && (
        <SectionCard title="Project Engagement Heatmap">
          <AdminEngagementHeatmap points={engagementPoints} />
          <p className="mt-3 text-xs text-ink-500">
            Weighted by each project&apos;s real view count — geographic
            density of actual interest, not a fabricated hot-area claim.
          </p>
        </SectionCard>
      )}
    </div>
  );
}
