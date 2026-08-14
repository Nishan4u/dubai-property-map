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
  // Themed replacements for window.confirm()/window.alert() -- those native
  // dialogs block JS execution while open (which is why "Deleting…" stayed
  // stuck on the row underneath one), don't match the site's dark theme,
  // and their exact rendering is unreliable across browsers. A confirm
  // step + an inline, dismissible error banner replace both.
  const [confirmTarget, setConfirmTarget] = useState<UserRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function confirmDelete() {
    const u = confirmTarget;
    if (!u) return;
    setConfirmTarget(null);
    setDeleteError(null);
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
      // Coerce defensively -- an unexpected non-string `error` value (or a
      // response body that isn't real JSON at all) must never render as
      // raw/garbled content, it should read as a real sentence.
      const message =
        typeof data.error === "string" && data.error.trim() ? data.error : "Failed to delete user.";
      setDeleteError(message);
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
                  onClick={() => setConfirmTarget(u)}
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

      {deleteError && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="shrink-0 font-medium text-rose-200 hover:text-rose-100">
            Dismiss
          </button>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-navy-700 bg-navy-850 p-6">
            <h2 className="text-sm font-semibold text-ink-100">Delete this account?</h2>
            <p className="mt-2 text-sm text-ink-400">
              Permanently delete <span className="font-medium text-ink-200">{confirmTarget.full_name ?? confirmTarget.email}</span>
              &apos;s account? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="rounded-lg border border-navy-600 px-4 py-2 text-xs font-medium text-ink-300 hover:text-ink-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-400"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
