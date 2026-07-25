import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShellClient } from "@/components/admin/AdminShellClient";

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

  return (
    <AdminShellClient
      userLabel={profile.full_name ?? "Admin"}
      userRole="Super Admin"
    >
      {children}
    </AdminShellClient>
  );
}
