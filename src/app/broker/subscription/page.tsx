import { CreditCard } from "lucide-react";
import { BrokerSubscriptionClient } from "@/components/broker/BrokerSubscriptionClient";
import { createClient } from "@/lib/supabase/server";
import {
  getBankTransferSettings,
  getBankTransfersForBroker,
  getBrokerReferralWalletAndSettings,
  getBrokerSubscriptionPlans,
  requireBrokerProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerSubscriptionPage() {
  const profile = await requireBrokerProfile();
  const supabase = await createClient();

  const [plans, { data: broker }, bankDetails, bankTransfers, referralInfo] = await Promise.all([
    getBrokerSubscriptionPlans(),
    supabase
      .from("brokers")
      .select("plan_key, subscription_status, stripe_customer_id, subscription_expires_at")
      .eq("id", profile.broker_id)
      .single(),
    getBankTransferSettings(),
    getBankTransfersForBroker(profile.broker_id),
    getBrokerReferralWalletAndSettings("broker", profile.broker_id),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <CreditCard className="h-5 w-5 text-gold-400" /> Subscription
        </h1>
        <p className="text-sm text-ink-400">
          An active subscription is required to submit property requests to developers.
          {broker?.subscription_expires_at && (
            <> Renews / expires {new Date(broker.subscription_expires_at).toLocaleDateString()}.</>
          )}
        </p>
      </div>

      <BrokerSubscriptionClient
        plans={plans}
        currentPlanKey={broker?.plan_key ?? null}
        subscriptionStatus={broker?.subscription_status ?? "no_subscription"}
        subscriptionExpiresAt={broker?.subscription_expires_at ?? null}
        hasStripeCustomer={!!broker?.stripe_customer_id}
        brokerId={profile.broker_id}
        bankDetails={bankDetails}
        bankTransfers={bankTransfers}
        walletBalance={referralInfo.walletBalance}
        walletNewPurchaseEnabled={referralInfo.walletNewPurchaseEnabled}
        pendingDiscount={referralInfo.pendingDiscount}
      />
    </div>
  );
}
