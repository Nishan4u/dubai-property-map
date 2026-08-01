"use client";

import { useState } from "react";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import { Badge } from "@/components/ui/Badge";
import { CompactSelect } from "@/components/public/CompactSelect";
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

const roles = ["buyer", "developer", "admin", "broker", "salesperson", "broker_agency"] as const;

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  const [rows, setRows] = useState(users);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDelete(u: UserRow) {
    if (!window.confirm(`Permanently delete ${u.full_name ?? u.email}'s account? This cannot be undone.`)) return;
    setDeletingId(u.id);
    const res = await fetch("/api/admin/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id }),
    });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== u.id));
    } else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Failed to delete user.");
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">{rows.length} registered users</p>
      <SearchableDataTable
        searchPlaceholder="Search users by name or email..."
        searchFields={(u) => [u.full_name, u.email, u.developer_name]}
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
              <CompactSelect
                label="Role"
                hideLabel
                allowClear={false}
                searchable={false}
                placeholder="Role"
                value={u.role}
                onChange={(v) => changeRole(u.id, v)}
                options={roles.map((r) => ({ label: r, value: r }))}
                className="w-36"
              />
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
              <div className="flex items-center gap-3">
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
                <button
                  onClick={() => handleDelete(u)}
                  disabled={deletingId === u.id}
                  className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
                >
                  {deletingId === u.id ? "Deleting…" : "Delete"}
                </button>
              </div>
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
