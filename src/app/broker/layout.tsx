import { redirect } from "next/navigation";
import { Ban, Clock, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BrokerShellClient } from "@/components/broker/BrokerShellClient";
import { BrokerOnboarding } from "@/components/broker/BrokerOnboarding";

// Defense-in-depth against indexing -- robots.ts already disallows
// "/broker/" (and the bare "/broker" root), but a page-level noindex
// (same pattern already used on /embed/developer/[slug]) makes
// exclusion resilient even against a crawler that doesn't respect
// robots.txt. Doesn't touch the entirely public "/brokers" directory.
export const metadata = { robots: { index: false, follow: false } };

export default async function BrokerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, brokers!profiles_broker_id_fkey(*)")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "broker") redirect("/");

  if (!profile.broker_id || !profile.brokers) {
    return <BrokerOnboarding />;
  }

  const broker = profile.brokers;

  if (broker.account_status === "pending_verification") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-850 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-ink-100">Awaiting admin approval</h1>
          <p className="mt-2 text-sm text-ink-400">
            Your broker application has been submitted for review. You&apos;ll get
            full access once an admin approves your account.
          </p>
        </div>
      </div>
    );
  }

  if (broker.account_status === "rejected") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-700/40 bg-navy-850 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <Ban className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-rose-400">Application not approved</h1>
          <p className="mt-2 text-sm text-ink-400">
            {broker.rejection_reason || "Your broker application was not approved. Contact support for details."}
          </p>
        </div>
      </div>
    );
  }

  if (broker.account_status === "suspended" || broker.account_status === "blocked") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-700/40 bg-navy-850 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-rose-400">
            {broker.account_status === "blocked" ? "Account blocked" : "Account suspended"}
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            {broker.suspension_reason ||
              `Your broker account has been ${broker.account_status}. Contact support for details.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrokerShellClient userLabel={broker.full_name} userRole="Broker">
      {children}
    </BrokerShellClient>
  );
}
