import { AdminReportsTabs } from "@/components/admin/AdminReportsTabs";
import {
  getAdPlacementPerformanceAdmin,
  getAgencyAnalyticsAdmin,
  getAiUsageReportAdmin,
  getAllBookingsAdmin,
  getAllBrochureDownloadsAdmin,
  getAllDevelopersAdmin,
  getAllLeadsAdmin,
  getAllProjectEventsAdmin,
  getAllProjectsAdmin,
  getBrokerAnalyticsAdmin,
  getCommunities,
  getConversionFunnelAdmin,
  getProjectEngagementPointsAdmin,
  getRevenueReportAdmin,
  getSalesReportAdmin,
  getSearchAnalyticsAdmin,
  getSubscriptionReportAdmin,
  getUserActivityReportAdmin,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [
    developers,
    projectRows,
    communities,
    leads,
    bookings,
    events,
    downloads,
    revenueReport,
    subscriptionReport,
    salesReport,
    brokerStats,
    agencyStats,
    activityReport,
    searchReport,
    aiUsageReport,
    conversionFunnel,
    adPerformance,
    engagementPoints,
  ] = await Promise.all([
    getAllDevelopersAdmin(),
    getAllProjectsAdmin(),
    getCommunities(),
    getAllLeadsAdmin(),
    getAllBookingsAdmin(),
    getAllProjectEventsAdmin(),
    getAllBrochureDownloadsAdmin(),
    getRevenueReportAdmin(),
    getSubscriptionReportAdmin(),
    getSalesReportAdmin(),
    getBrokerAnalyticsAdmin(),
    getAgencyAnalyticsAdmin(),
    getUserActivityReportAdmin(),
    getSearchAnalyticsAdmin(),
    getAiUsageReportAdmin(),
    getConversionFunnelAdmin(),
    getAdPlacementPerformanceAdmin(),
    getProjectEngagementPointsAdmin(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Reports</h1>
        <p className="text-sm text-ink-400">
          Platform-wide performance across developers, projects, communities, revenue, and people.
        </p>
      </div>

      <AdminReportsTabs
        overview={{ developers, projectRows, communities, leads, bookings, events, downloads }}
        revenue={{ report: revenueReport }}
        subscriptions={{ report: subscriptionReport }}
        sales={{ sales: salesReport }}
        people={{ developers, projectRows, leads, brokerStats, agencyStats }}
        activity={{ report: activityReport }}
        search={{ report: searchReport }}
        aiUsage={{ report: aiUsageReport }}
        conversion={{ funnel: conversionFunnel, adPerformance }}
        engagementPoints={engagementPoints}
      />
    </div>
  );
}
