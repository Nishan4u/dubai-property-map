import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminInviteMemberForm } from "@/components/admin/AdminInviteMemberForm";
import { InvitationsTable } from "@/components/admin/InvitationsTable";
import { getAllUsersAdmin, getInvitationsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, memberInvitations] = await Promise.all([
    getAllUsersAdmin(),
    getInvitationsAdmin("admin_member"),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Platform Users</h1>
        <p className="text-sm text-ink-400">
          Manage buyer/investor and developer accounts, roles and permissions
          across the platform.
        </p>
      </div>

      <AdminUsersTable users={users} />

      <div className="space-y-3 border-t border-navy-800 pt-6">
        <AdminInviteMemberForm />
        <InvitationsTable invitations={memberInvitations} />
      </div>
    </div>
  );
}
