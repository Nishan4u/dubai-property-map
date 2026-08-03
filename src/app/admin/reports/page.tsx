import { AdminReportsTabs } from "@/components/admin/AdminReportsTabs";
import {
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
      />
    </div>
  );
}
