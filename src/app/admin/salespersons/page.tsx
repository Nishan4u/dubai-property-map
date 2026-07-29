import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { AdminCreateSalespersonForm } from "@/components/admin/AdminCreateSalespersonForm";
import { InvitationsTable } from "@/components/admin/InvitationsTable";
import { DeleteSalespersonButton } from "@/components/admin/DeleteSalespersonButton";
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

      <DataTable
        columns={[
          {
            header: "Salesperson",
            render: (s) => (
              <div className="flex items-center gap-2">
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo_url} alt={s.full_name} className="h-6 w-6 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                    {s.full_name.charAt(0)}
                  </span>
                )}
                <span className="font-medium text-ink-100">{s.full_name}</span>
              </div>
            ),
          },
          { header: "Developer", render: (s) => s.developers?.name ?? "—" },
          { header: "Job Title", render: (s) => s.job_title ?? "—" },
          { header: "Email", render: (s) => s.email },
          {
            header: "Status",
            render: (s) => (
              <Badge tone={s.status === "active" ? "green" : s.status === "pending_invitation" ? "gold" : "neutral"}>
                {s.status.replace(/_/g, " ")}
              </Badge>
            ),
          },
          {
            header: "",
            render: (s) => <DeleteSalespersonButton salespersonId={s.id} salespersonName={s.full_name} />,
          },
        ]}
        rows={salespersons}
      />

      <div className="space-y-3 border-t border-navy-800 pt-6">
        <h2 className="text-sm font-semibold text-ink-100">Salesperson Invitations</h2>
        <InvitationsTable invitations={invitations} showDeveloper />
      </div>
    </div>
  );
}
