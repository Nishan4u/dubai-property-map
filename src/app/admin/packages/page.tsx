import { AdminPackagesManager } from "@/components/admin/AdminPackagesManager";
import {
  getAllSubscriptionPlansAdmin,
  getBrokerPlanSubscriberCounts,
  getPlanSubscriberCounts,
  getSalespersonPlanSubscriberCounts,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const [plans, developerCounts, brokerCounts, salespersonCounts] = await Promise.all([
    getAllSubscriptionPlansAdmin(),
    getPlanSubscriberCounts(),
    getBrokerPlanSubscriberCounts(),
    getSalespersonPlanSubscriberCounts(),
  ]);
  const subscriberCounts = new Map([...developerCounts, ...brokerCounts, ...salespersonCounts]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Packages & Plans</h1>
        <p className="text-sm text-ink-400">
          Manage subscription tiers shown on the Broker Subscription page and
          the Salesperson Subscription page. Developer plans aren&apos;t shown to
          developers anymore (they get free, unlimited listings), but their
          Feature Limits are still actually enforced (featured pins, homepage
          banner) against whichever plan_tier a developer is assigned here.
          Subscriber counts are real (live counts). Add-on placements
          (Homepage Banner, Sidebar Banner, Sponsored Pin, Community/Project/
          Developer Banner) are requested and approved under Ads, not here.
        </p>
      </div>

      <AdminPackagesManager
        plans={plans}
        subscriberCounts={Object.fromEntries(subscriberCounts)}
      />
    </div>
  );
}
