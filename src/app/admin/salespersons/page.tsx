import { AdminCreateSalespersonForm } from "@/components/admin/AdminCreateSalespersonForm";
import { InvitationsTable } from "@/components/admin/InvitationsTable";
import { SalespersonsTable } from "@/components/admin/SalespersonsTable";
import { getAllDevelopersAdmin, getAllSalespersonsAdmin, getInvitationsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminSalespersonsPage() {
  const [salespersons, developers, invitations] = await Promise.all([
    getAllSalespersonsAdmin(),
    getAllDevelopersAdmin(),
    getInvitationsAdmin(["admin_salesperson", "developer_salesperson"]),
  ]);

  const activeDevelopers = developers.filter((d) => d.status === "active").map((d) => ({ id: d.id, name: d.name }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Salespersons</h1>
        <p className="text-sm text-ink-400">{salespersons.length} salespersons across every developer on the platform.</p>
      </div>

      <AdminCreateSalespersonForm developers={activeDevelopers} />

      <SalespersonsTable salespersons={salespersons} />

      <div className="space-y-3 border-t border-navy-800 pt-6">
        <h2 className="text-sm font-semibold text-ink-100">Salesperson Invitations</h2>
        <InvitationsTable invitations={invitations} showDeveloper />
      </div>
    </div>
  );
}
