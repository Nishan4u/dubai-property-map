import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { getAllUsersAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getAllUsersAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Platform Users</h1>
        <p className="text-sm text-ink-400">
          Manage buyer/investor and developer accounts, roles and permissions
          across the platform.
        </p>
      </div>

      <AdminUsersTable users={users} />
    </div>
  );
}
