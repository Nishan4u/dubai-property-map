import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffShellClient } from "@/components/staff/StaffShellClient";

// Defense-in-depth against indexing -- robots.ts already disallows
// "/staff", but a page-level noindex (same pattern already used on
// /embed/developer/[slug]) makes exclusion resilient even against a
// crawler that doesn't respect robots.txt.
export const metadata = { robots: { index: false, follow: false } };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/staff/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, staff_id, staff:staff_id(full_name, status, login_enabled)")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "staff" || !profile.staff_id) {
    redirect("/staff/login");
  }

  const staff = Array.isArray(profile.staff) ? profile.staff[0] : profile.staff;
  if (!staff || staff.status !== "active" || !staff.login_enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-700/40 bg-navy-850 p-8 text-center">
          <h1 className="text-lg font-semibold text-rose-400">Access unavailable</h1>
          <p className="mt-2 text-sm text-ink-400">
            Your staff account is currently inactive or login has been disabled. Contact your admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <StaffShellClient userLabel={staff.full_name} userRole="Staff">
      {children}
    </StaffShellClient>
  );
}
