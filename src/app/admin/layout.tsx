import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShellClient } from "@/components/admin/AdminShellClient";
import { getAdminPermissionContext, visibleModuleKeys } from "@/lib/permissions";

// Defense-in-depth against indexing -- robots.ts already disallows
// "/admin", but a page-level noindex (same pattern already used on
// /embed/developer/[slug]) makes exclusion resilient even against a
// crawler that doesn't respect robots.txt.
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
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
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/");

  const { profile: permissionProfile, permissions } = await getAdminPermissionContext(supabase, user.id);
  const modules = visibleModuleKeys(permissionProfile, permissions);
  if (permissionProfile.custom_role_id && modules.length === 0) redirect("/");

  return (
    <AdminShellClient
      userLabel={profile.full_name ?? "Admin"}
      userRole={permissionProfile.custom_role_id ? "Restricted Admin" : "Super Admin"}
      visibleModuleKeys={modules}
    >
      {children}
    </AdminShellClient>
  );
}
