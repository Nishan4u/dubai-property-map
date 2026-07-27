import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { CreateStaffForm } from "@/components/admin/CreateStaffForm";
import { getAllStaffAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "green" | "gold" | "neutral" | "red"> = {
  active: "green",
  inactive: "gold",
  archived: "neutral",
};

export default async function AdminStaffPage() {
  const staff = await getAllStaffAdmin();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Staff Management</h1>
        <p className="text-sm text-ink-400">
          {staff.length} internal staff account{staff.length === 1 ? "" : "s"}. No public registration —
          share the login path privately at <span className="font-mono text-ink-300">/staff/login</span>.
        </p>
      </div>

      <CreateStaffForm />

      <DataTable
        columns={[
          {
            header: "Staff",
            render: (s) => (
              <div>
                <Link href={`/admin/staff/${s.id}`} className="font-medium text-ink-100 hover:text-gold-400">
                  {s.full_name}
                </Link>
                <p className="text-xs text-ink-500">{s.staff_code}</p>
              </div>
            ),
          },
          { header: "Email", render: (s) => s.email },
          { header: "Position", render: (s) => s.position ?? "—" },
          { header: "Referral Code", render: (s) => <span className="font-mono text-xs text-gold-400">{s.referral_code}</span> },
          {
            header: "Commission",
            render: (s) => (s.commission_type === "flat" ? `AED ${s.commission_rate}` : `${s.commission_rate}%`),
          },
          {
            header: "Status",
            render: (s) => (
              <div className="flex items-center gap-2">
                <Badge tone={statusTone[s.status] ?? "neutral"}>{s.status}</Badge>
                {!s.login_enabled && <Badge tone="red">Login Disabled</Badge>}
              </div>
            ),
          },
          {
            header: "",
            render: (s) => (
              <Link href={`/admin/staff/${s.id}`} className="text-xs font-medium text-gold-400 hover:text-gold-300">
                Manage
              </Link>
            ),
          },
        ]}
        rows={staff}
      />
    </div>
  );
}
