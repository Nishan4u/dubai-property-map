"use client";

import { Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";

const team = [
  { id: "t1", name: "Fatima Al Marri", role: "Sales", email: "fatima@developer.com", status: "active" as const },
  { id: "t2", name: "Omar Sharif", role: "Sales", email: "omar@developer.com", status: "active" as const },
  { id: "t3", name: "Layla Haddad", role: "Marketing", email: "layla@developer.com", status: "active" as const },
  { id: "t4", name: "Yousef Nasser", role: "Marketing", email: "yousef@developer.com", status: "invited" as const },
];

export default function TeamPage() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
            <Users className="h-5 w-5 text-gold-400" /> Team
          </h1>
          <p className="text-sm text-ink-400">
            Manage sales and marketing users with role-based permissions.
          </p>
        </div>
        <button className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400">
          Invite Member
        </button>
      </div>

      <DataTable
        columns={[
          { header: "Name", render: (t) => <span className="font-medium text-ink-100">{t.name}</span> },
          { header: "Role", render: (t) => t.role },
          { header: "Email", render: (t) => t.email },
          {
            header: "Status",
            render: (t) => (
              <Badge tone={t.status === "active" ? "green" : "gold"}>{t.status}</Badge>
            ),
          },
        ]}
        rows={team}
      />
    </div>
  );
}
