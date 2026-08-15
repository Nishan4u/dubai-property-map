import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeveloperShellClient } from "@/components/dashboard/DeveloperShellClient";
import { DeveloperOnboarding } from "@/components/dashboard/DeveloperOnboarding";

// Defense-in-depth against indexing -- robots.ts already disallows
// "/dashboard", but a page-level noindex (same pattern already used on
// /embed/developer/[slug]) makes exclusion resilient even against a
// crawler that doesn't respect robots.txt.
export const metadata = { robots: { index: false, follow: false } };

export default async function DeveloperDashboardLayout({
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
    .select("*, developers(*)")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "developer") redirect("/");

  if (profile.suspended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-700/40 bg-navy-850 p-8 text-center">
          <h1 className="text-lg font-semibold text-rose-400">
            Account suspended
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            Your account has been suspended. Contact support for more
            information.
          </p>
        </div>
      </div>
    );
  }

  if (!profile.developer_id || !profile.developers) {
    return <DeveloperOnboarding />;
  }

  if (profile.developers.status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-850 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-ink-100">
            Awaiting admin approval
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            {profile.developers.name} has been submitted for review. You&apos;ll
            get full dashboard access once an admin approves your account.
          </p>
        </div>
      </div>
    );
  }

  if (profile.developers.status === "suspended") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-700/40 bg-navy-850 p-8 text-center">
          <h1 className="text-lg font-semibold text-rose-400">
            Account suspended
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            Your developer account has been suspended. Contact support for
            more information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DeveloperShellClient
      userLabel={profile.developers.name}
      userRole="Developer"
    >
      {children}
    </DeveloperShellClient>
  );
}
