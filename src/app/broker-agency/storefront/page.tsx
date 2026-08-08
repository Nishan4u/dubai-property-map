import { Store } from "lucide-react";
import { AgencyStorefrontManagerClient } from "@/components/broker-agency/AgencyStorefrontManagerClient";
import {
  getPublishedProjects,
  getStorefrontItemsForBrokerAgency,
  requireBrokerAgencyProfile,
} from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BrokerAgencyStorefrontPage() {
  const profile = await requireBrokerAgencyProfile();
  const supabase = await createClient();

  const [{ data: agency }, items, projectRows] = await Promise.all([
    supabase.from("brokerages").select("subdomain").eq("id", profile.broker_agency_id).maybeSingle(),
    getStorefrontItemsForBrokerAgency(profile.broker_agency_id).catch(() => []),
    getPublishedProjects(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Store className="h-5 w-5 text-gold-400" /> Storefront
        </h1>
        <p className="text-sm text-ink-400">
          Your public, white-label page of featured properties, shared under your own subdomain.
        </p>
      </div>
      <AgencyStorefrontManagerClient
        brokerageId={profile.broker_agency_id}
        subdomain={agency?.subdomain ?? null}
        items={items}
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
