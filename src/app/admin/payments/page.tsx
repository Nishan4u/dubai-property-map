import { StatCard } from "@/components/ui/StatCard";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { PaymentsExportButton } from "@/components/admin/PaymentsExportButton";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPaymentsOverviewStats } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const [{ data: developers }, stats] = await Promise.all([
    supabase
      .from("developers")
      .select("id, name, plan_tier, subscription_status, stripe_customer_id")
      .order("name"),
    getPaymentsOverviewStats(),
  ]);

  const rows = developers ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Wallet className="h-5 w-5 text-gold-400" /> Payments & Revenue
        </h1>
        <p className="text-sm text-ink-400">
          Across developers, brokers, salespersons, and broker agencies — synced live from Stripe via
          webhook, plus bank transfer and Referral Wallet payments.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Estimated Combined MRR" value={`AED ${stats.estimatedMrr.toLocaleString()}`} />
        <StatCard label="Total Active Subscriptions" value={stats.totalActiveSubscriptions.toLocaleString()} />
        <StatCard label="Developers / Brokers / Salespersons / Agencies" value={`${stats.totalDevelopers} / ${stats.totalBrokers} / ${stats.totalSalespersons} / ${stats.totalBrokerages}`} />
        <StatCard
          label="Bank Transfers Approved"
          value={stats.totalBankTransfersApproved.toLocaleString()}
          delta={`AED ${stats.totalBankTransferAmount.toLocaleString()}`}
        />
        <StatCard
          label="Wallet Payments"
          value={stats.totalWalletPayments.toLocaleString()}
          delta={`AED ${stats.totalWalletPaymentAmount.toLocaleString()}`}
        />
      </div>

      <PaymentsExportButton />

      <PaymentsTable rows={rows} />
      <p className="text-xs text-ink-500">
        The table below shows developer subscriptions only, at the UAE&apos;s standard 5% VAT rate for
        display purposes. Use the export above for a full cross-account-type payment report with each
        plan&apos;s actual configured VAT rate.
      </p>
    </div>
  );
}
