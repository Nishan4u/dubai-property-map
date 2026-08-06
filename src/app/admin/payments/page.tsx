import { StatCard } from "@/components/ui/StatCard";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { AllPaymentsTable } from "@/components/admin/AllPaymentsTable";
import { PaymentsExportButton } from "@/components/admin/PaymentsExportButton";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPaymentsFeedAdmin, getPaymentsOverviewStats } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const [{ data: developers }, stats, paymentsFeed] = await Promise.all([
    supabase
      .from("developers")
      .select("id, name, plan_tier, subscription_status, stripe_customer_id")
      .order("name"),
    getPaymentsOverviewStats(),
    getPaymentsFeedAdmin(150),
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

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">All Payments</h2>
        <p className="mb-3 text-xs text-ink-500">
          Every developer, broker, salesperson, and broker agency payment — Stripe, Bank Transfer, Network
          International, and Referral Wallet — most recent {paymentsFeed.length} shown. Use the export
          above for a full historical report with VAT broken out per plan.
        </p>
        <AllPaymentsTable rows={paymentsFeed} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Developer Accounts</h2>
        <p className="mb-3 text-xs text-ink-500">
          Every developer&apos;s current plan and subscription status, at the UAE&apos;s standard 5% VAT
          rate for display purposes — including accounts with no payment yet.
        </p>
        <PaymentsTable rows={rows} />
      </div>
    </div>
  );
}
