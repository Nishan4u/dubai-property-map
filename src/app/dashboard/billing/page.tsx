import { BillingClient } from "@/components/dashboard/BillingClient";
import { createClient } from "@/lib/supabase/server";
import { requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const profile = await requireDeveloperProfile();
  const supabase = await createClient();
  const { data: developer } = await supabase
    .from("developers")
    .select("plan_tier, subscription_status, stripe_customer_id")
    .eq("id", profile.developer_id)
    .single();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Billing & Invoices</h1>
        <p className="text-sm text-ink-400">
          Manage your subscription and view invoices via Stripe&apos;s secure
          billing portal.
        </p>
      </div>
      <BillingClient
        planTier={developer?.plan_tier ?? "free"}
        subscriptionStatus={developer?.subscription_status ?? "inactive"}
        hasStripeCustomer={!!developer?.stripe_customer_id}
      />
    </div>
  );
}
