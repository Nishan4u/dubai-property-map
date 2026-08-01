import { StatCard } from "@/components/ui/StatCard";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const planPrice: Record<string, number> = {
  free: 0,
  starter: 999,
  professional: 2999,
  enterprise: 0, // custom pricing, not counted in MRR estimate
};

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const { data: developers } = await supabase
    .from("developers")
    .select("id, name, plan_tier, subscription_status, stripe_customer_id")
    .order("name");

  const rows = developers ?? [];
  const mrr = rows
    .filter((d) => d.subscription_status === "active")
    .reduce((sum, d) => sum + (planPrice[d.plan_tier] ?? 0), 0);
  const activeCount = rows.filter((d) => d.subscription_status === "active").length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Wallet className="h-5 w-5 text-gold-400" /> Payments & Revenue
        </h1>
        <p className="text-sm text-ink-400">
          Subscription status per developer, synced live from Stripe via
          webhook once configured (Settings page).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Estimated MRR" value={`AED ${mrr.toLocaleString()}`} />
        <StatCard label="Active Subscriptions" value={String(activeCount)} />
        <StatCard label="Total Developers" value={String(rows.length)} />
      </div>

      <PaymentsTable rows={rows} />
      <p className="text-xs text-ink-500">
        Subtotal/VAT/Total reflect the developer&apos;s current plan price at
        the UAE&apos;s standard 5% VAT rate. This platform doesn&apos;t yet
        store historical per-invoice line items — that requires syncing
        Stripe&apos;s Invoice API once billing is active.
      </p>
    </div>
  );
}
