"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  developer_id: string | null;
  developer_name: string | null;
  suspended: boolean;
  created_at: string;
}

const roles = ["buyer", "developer", "admin"] as const;

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  const [rows, setRows] = useState(users);

  async function changeRole(id: string, role: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, role } : r)));
    const supabase = createClient();
    await supabase.from("profiles").update({ role }).eq("id", id);
    await logAudit("user.role_changed", "profile", id, { role });
  }

  async function toggleSuspended(id: string, suspended: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, suspended } : r)));
    const supabase = createClient();
    await supabase.from("profiles").update({ suspended }).eq("id", id);
    await logAudit(suspended ? "user.suspended" : "user.reinstated", "profile", id);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">{rows.length} registered users</p>
      <DataTable
        columns={[
          {
            header: "User",
            render: (u) => (
              <div>
                <p className="font-medium text-ink-100">{u.full_name ?? "—"}</p>
                <p className="text-xs text-ink-500">{u.email}</p>
              </div>
            ),
          },
          {
            header: "Role",
            render: (u) => (
              <select
                value={u.role}
                onChange={(e) => changeRole(u.id, e.target.value)}
                className="rounded-lg border border-navy-600 bg-navy-800 px-2 py-1 text-xs text-ink-100 focus:outline-none"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ),
          },
          {
            header: "Developer",
            render: (u) => u.developer_name ?? "—",
          },
          {
            header: "Joined",
            render: (u) => new Date(u.created_at).toLocaleDateString(),
          },
          {
            header: "Status",
            render: (u) => (
              <Badge tone={u.suspended ? "red" : "green"}>
                {u.suspended ? "Suspended" : "Active"}
              </Badge>
            ),
          },
          {
            header: "",
            render: (u) => (
              <button
                onClick={() => toggleSuspended(u.id, !u.suspended)}
                className={
                  u.suspended
                    ? "text-xs font-medium text-emerald-400 hover:text-emerald-300"
                    : "text-xs font-medium text-rose-400 hover:text-rose-300"
                }
              >
                {u.suspended ? "Reinstate" : "Suspend"}
              </button>
            ),
          },
        ]}
        rows={rows}
      />
      {rows.length === 0 && (
        <p className="text-sm text-ink-500">No users yet.</p>
      )}
    </div>
  );
}
