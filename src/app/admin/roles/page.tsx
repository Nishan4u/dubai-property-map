import { AdminRolesManager } from "@/components/admin/AdminRolesManager";
import { AdminCreateTeamMemberForm } from "@/components/admin/AdminCreateTeamMemberForm";
import { getAllCustomRolesAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  const roles = await getAllCustomRolesAdmin();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Roles & Permissions</h1>
        <p className="text-sm text-ink-400">
          Create limited-access admin roles for internal team members — e.g. a Finance Officer who only sees
          Payments and Subscriptions. Every admin account created without a role keeps full, unrestricted access,
          exactly as before this page existed.
        </p>
      </div>

      <AdminRolesManager roles={roles} />

      <div>
        <h2 className="text-sm font-semibold text-ink-100">Admin Team Members</h2>
        <p className="mt-1 mb-3 text-xs text-ink-500">
          Create a new admin account, optionally restricted to one of the roles above.
        </p>
        <AdminCreateTeamMemberForm roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
      </div>
    </div>
  );
}
