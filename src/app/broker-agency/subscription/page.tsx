import { CreditCard } from "lucide-react";
import { BrokerAgencySubscriptionClient } from "@/components/broker-agency/BrokerAgencySubscriptionClient";
import { createClient } from "@/lib/supabase/server";
import {
  getBankTransferSettings,
  getBankTransfersForBrokerage,
  getBrokerAgencySubscriptionPlans,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerAgencySubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("broker_agency_id").eq("id", user!.id).single();
  const brokerageId = profile!.broker_agency_id as string;

  const [plans, { data: agency }, bankDetails, bankTransfers] = await Promise.all([
    getBrokerAgencySubscriptionPlans(),
    supabase
      .from("brokerages")
      .select("plan_key, subscription_status, stripe_customer_id, subscription_expires_at")
      .eq("id", brokerageId)
      .single(),
    getBankTransferSettings(),
    getBankTransfersForBrokerage(brokerageId),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <CreditCard className="h-5 w-5 text-gold-400" /> Subscription
        </h1>
        <p className="text-sm text-ink-400">
          An active subscription is required to submit property requests to developers. This subscription is
          independent of any individual broker&apos;s subscription on your roster.
          {agency?.subscription_expires_at && (
            <> Renews / expires {new Date(agency.subscription_expires_at).toLocaleDateString()}.</>
          )}
        </p>
      </div>

      <BrokerAgencySubscriptionClient
        plans={plans}
        currentPlanKey={agency?.plan_key ?? null}
        subscriptionStatus={agency?.subscription_status ?? "no_subscription"}
        subscriptionExpiresAt={agency?.subscription_expires_at ?? null}
        hasStripeCustomer={!!agency?.stripe_customer_id}
        brokerageId={brokerageId}
        bankDetails={bankDetails}
        bankTransfers={bankTransfers}
      />
    </div>
  );
}
