import { CreditCard } from "lucide-react";
import { SalespersonSubscriptionClient } from "@/components/salesperson/SalespersonSubscriptionClient";
import { createClient } from "@/lib/supabase/server";
import {
  getBankTransferSettings,
  getBankTransfersForSalesperson,
  getSalespersonSubscriptionPlans,
  requireSalespersonProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function SalespersonSubscriptionPage() {
  const profile = await requireSalespersonProfile();
  const supabase = await createClient();

  const [plans, { data: salesperson }, bankDetails, bankTransfers] = await Promise.all([
    getSalespersonSubscriptionPlans(),
    supabase
      .from("salespersons")
      .select("plan_key, subscription_status, stripe_customer_id, subscription_expires_at")
      .eq("id", profile.salesperson_id)
      .single(),
    getBankTransferSettings(),
    getBankTransfersForSalesperson(profile.salesperson_id),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <CreditCard className="h-5 w-5 text-gold-400" /> Subscription
        </h1>
        <p className="text-sm text-ink-400">
          An active subscription is required to access your salesperson portal.
          {salesperson?.subscription_expires_at && (
            <> Renews / expires {new Date(salesperson.subscription_expires_at).toLocaleDateString()}.</>
          )}
        </p>
      </div>

      <SalespersonSubscriptionClient
        plans={plans}
        currentPlanKey={salesperson?.plan_key ?? null}
        subscriptionStatus={salesperson?.subscription_status ?? "no_subscription"}
        subscriptionExpiresAt={salesperson?.subscription_expires_at ?? null}
        hasStripeCustomer={!!salesperson?.stripe_customer_id}
        salespersonId={profile.salesperson_id}
        bankDetails={bankDetails}
        bankTransfers={bankTransfers}
      />
    </div>
  );
}
