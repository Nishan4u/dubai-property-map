import { AdminReferralProgramTabs } from "@/components/admin/AdminReferralProgramTabs";
import { getBrokerReferralSettings, getAdminReferralProgramStats } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminReferralProgramPage() {
  const [settings, stats] = await Promise.all([getBrokerReferralSettings(), getAdminReferralProgramStats()]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Referral Program</h1>
        <p className="text-sm text-ink-400">
          Brokers and salespersons each get a unique referral code they can share to recruit other brokers/
          salespersons — the new subscriber gets a discount, the referrer earns cashback into their Referral Wallet.
        </p>
      </div>

      <AdminReferralProgramTabs settings={settings} stats={stats} />
    </div>
  );
}
