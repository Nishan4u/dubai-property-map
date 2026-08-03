import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getAllReservationsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "neutral" | "gold" | "green" | "red" | "blue"> = {
  draft: "neutral",
  sent: "gold",
  viewed: "blue",
  signed: "green",
  cancelled: "red",
};

export default async function AdminReservationsPage() {
  const reservations = await getAllReservationsAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Reservations</h1>
        <p className="text-sm text-ink-400">
          Unit reservations and their e-signature status across every developer, broker, and salesperson.
        </p>
      </div>

      <DataTable
        columns={[
          {
            header: "Buyer",
            render: (r) => {
              const client = Array.isArray(r.crm_clients) ? r.crm_clients[0] : r.crm_clients;
              return <span className="font-medium text-ink-100">{client?.full_name ?? "—"}</span>;
            },
          },
          {
            header: "Project",
            render: (r) => (Array.isArray(r.projects) ? r.projects[0] : r.projects)?.name ?? "—",
          },
          { header: "Unit", render: (r) => r.unit_number ?? "—" },
          { header: "Price", render: (r) => `AED ${Math.round(r.price_aed).toLocaleString()}` },
          {
            header: "Status",
            render: (r) => <Badge tone={statusTone[r.status] ?? "neutral"}>{r.status}</Badge>,
          },
          {
            header: "Signed",
            render: (r) => (r.signed_at ? new Date(r.signed_at).toLocaleDateString() : "—"),
          },
        ]}
        rows={reservations}
      />
      {reservations.length === 0 && <p className="text-sm text-ink-500">No reservations yet.</p>}
    </div>
  );
}
