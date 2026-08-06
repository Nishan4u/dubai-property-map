import { Gift } from "lucide-react";
import { BrokerReferralClient } from "@/components/broker/BrokerReferralClient";
import { requireBrokerProfile, getBrokerReferralSummary, getWithdrawalRequestsForOwner } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerReferralPage() {
  const profile = await requireBrokerProfile();
  const [summary, withdrawalRequests] = await Promise.all([
    getBrokerReferralSummary(profile.broker_id),
    getWithdrawalRequestsForOwner("broker", profile.broker_id),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Gift className="h-5 w-5 text-gold-400" /> Referral Program
        </h1>
        <p className="text-sm text-ink-400">
          Share your code with brokers or salespersons you know — they get a discount on their first
          subscription, and you earn cashback into your wallet once they subscribe.
        </p>
      </div>

      <BrokerReferralClient
        referralCode={summary.referralCode}
        discountPercent={summary.discountPercent}
        totalReferrals={summary.totalReferrals}
        successfulReferrals={summary.successfulReferrals}
        pendingReferrals={summary.pendingReferrals}
        wallet={summary.wallet}
        history={summary.history}
        withdrawalRequests={withdrawalRequests}
      />
    </div>
  );
}
