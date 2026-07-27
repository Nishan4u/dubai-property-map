import { getStaffSelfData } from "@/lib/supabase/queries";
import { CopyReferralButton } from "@/components/staff/CopyReferralButton";

export const dynamic = "force-dynamic";

export default async function StaffReferralCodePage() {
  const { staff } = await getStaffSelfData();
  if (!staff) return null;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Referral Code</h1>
        <p className="text-sm text-ink-400">Share this code with prospective customers when they subscribe.</p>
      </div>

      <div className="max-w-md rounded-xl border border-navy-700 bg-navy-850 p-6 text-center">
        <p className="text-xs text-ink-500">Your Referral Code</p>
        <p className="mt-2 font-mono text-3xl font-bold text-gold-400">{staff.referral_code}</p>
        <CopyReferralButton code={staff.referral_code} />
      </div>

      <div className="max-w-md rounded-xl border border-navy-700 bg-navy-850 p-4 text-xs text-ink-400">
        <p className="font-semibold text-ink-200">How it works</p>
        <p className="mt-2">
          When a developer, broker, or salesperson subscribes and enters this code at checkout, they&apos;re
          permanently connected to you — they never need to re-enter it on future renewals. Commission is only
          earned once a subscription is actually paid and active; sharing or clicking a link alone never generates
          commission.
        </p>
      </div>
    </div>
  );
}
