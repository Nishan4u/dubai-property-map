import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveSalespersonsForDeveloper,
  getCurrentProfile,
  getRememberedSalesperson,
  isFreeAccessEnabled,
} from "@/lib/supabase/queries";
import { PropertyRequestForm } from "./PropertyRequestForm";

// Renders nothing for non-brokers — this is purely additive to the project
// page, not a general-purpose enquiry widget (that's ProjectEnquiryPanel).
export async function RequestPropertyPanel({
  projectId,
  developerId,
}: {
  projectId: string;
  developerId: string;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "broker" || !profile.broker_id) return null;

  const supabase = await createClient();
  const { data: broker } = await supabase
    .from("brokers")
    .select("account_status, subscription_status")
    .eq("id", profile.broker_id)
    .single();
  if (!broker) return null;

  if (broker.account_status !== "approved") {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5 text-sm text-ink-400">
        Your broker account is pending admin approval — you&apos;ll be able to request this property once
        it&apos;s approved.
      </div>
    );
  }

  if (broker.subscription_status !== "active" && !(await isFreeAccessEnabled("broker"))) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5 text-sm text-ink-400">
        <p>An active subscription is required to submit property requests.</p>
        <Link href="/broker/subscription" className="mt-2 inline-block text-sm font-medium text-gold-400 hover:underline">
          Subscribe →
        </Link>
      </div>
    );
  }

  const [salespersons, rememberedSalespersonId] = await Promise.all([
    getActiveSalespersonsForDeveloper(developerId),
    getRememberedSalesperson(profile.broker_id, developerId),
  ]);

  return (
    <PropertyRequestForm
      projectId={projectId}
      salespersons={salespersons}
      rememberedSalespersonId={rememberedSalespersonId}
    />
  );
}
