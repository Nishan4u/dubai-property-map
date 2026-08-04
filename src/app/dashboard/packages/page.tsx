import { PlanCards } from "@/components/dashboard/PlanCards";
import { AdRequestSection } from "@/components/dashboard/AdRequestSection";
import { FeatureProjectSection } from "@/components/dashboard/FeatureProjectSection";
import { createClient } from "@/lib/supabase/server";
import {
  getAdPlacementsForDeveloper,
  getBankTransferSettings,
  getCommunities,
  getProjectsForDeveloper,
  getSubscriptionPlans,
  requireDeveloperProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperPackagesPage() {
  const profile = await requireDeveloperProfile();
  const developerId = profile.developer_id;

  const supabase = await createClient();
  const [{ data: developer }, placements, projects, communities, plans, bankDetails] =
    await Promise.all([
      supabase.from("developers").select("plan_tier").eq("id", developerId).single(),
      getAdPlacementsForDeveloper(developerId),
      getProjectsForDeveloper(developerId),
      getCommunities(),
      getSubscriptionPlans(),
      getBankTransferSettings(),
    ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Packages & Subscription</h1>
        <p className="text-sm text-ink-400">
          You&apos;re on the <span className="capitalize text-gold-400">{developer?.plan_tier ?? "free"}</span> plan.
        </p>
      </div>

      <PlanCards
        plans={plans}
        currentPlan={developer?.plan_tier ?? "free"}
        developerId={developerId}
        bankDetails={bankDetails}
      />

      <FeatureProjectSection
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          featured: p.featured,
          featured_until: p.featured_until,
        }))}
      />

      <AdRequestSection
        placements={placements}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        communities={communities.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
