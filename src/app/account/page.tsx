import { PublicShell } from "@/components/public/PublicShell";
import { AccountPageClient } from "@/components/account/AccountPageClient";
import { getCurrentProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const profile = await getCurrentProfile();

  if (profile?.suspended) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <div className="rounded-2xl border border-rose-700/40 bg-navy-850 p-8">
            <h1 className="text-lg font-semibold text-rose-400">
              Account suspended
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              Your account has been suspended. Contact support for more
              information.
            </p>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <AccountPageClient />
    </PublicShell>
  );
}
