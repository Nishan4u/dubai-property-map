"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "invited" | "active" | "removed" | "expired" | "failed" | "cancelled";
  invitation_id: string | null;
  can_manage_projects: boolean;
  can_manage_leads: boolean;
  can_manage_billing: boolean;
}

const statusTone: Record<TeamMember["status"], "green" | "gold" | "red" | "neutral"> = {
  invited: "gold",
  active: "green",
  removed: "neutral",
  expired: "red",
  failed: "red",
  cancelled: "neutral",
};

const permissionFields = [
  { key: "can_manage_projects" as const, label: "Projects" },
  { key: "can_manage_leads" as const, label: "Leads" },
  { key: "can_manage_billing" as const, label: "Billing" },
];

export function TeamTable({
  members,
}: {
  members: TeamMember[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(members);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Sales");
  const [permissions, setPermissions] = useState({
    can_manage_projects: true,
    can_manage_leads: true,
    can_manage_billing: false,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const res = await fetch("/api/dashboard/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, permissions }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? "Could not send invitation.");
      setLoading(false);
      return;
    }
    setRows((prev) => [data.member, ...prev]);
    if (data.invitationStatus === "failed") {
      setErrorMsg("Team member was added, but the invitation email could not be sent — use Resend below.");
    }
    setName("");
    setEmail("");
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function resendInvite(invitationId: string | null, memberId: string) {
    if (!invitationId) return;
    setActioningId(memberId);
    const res = await fetch(`/api/invitations/${invitationId}/resend`, { method: "POST" });
    const data = await res.json();
    setRows((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: data.ok ? "invited" : "failed" } : m))
    );
    setActioningId(null);
  }

  async function cancelInvite(invitationId: string | null, memberId: string) {
    if (!invitationId) return;
    setActioningId(memberId);
    await fetch(`/api/invitations/${invitationId}/cancel`, { method: "POST" });
    setRows((prev) => prev.map((m) => (m.id === memberId ? { ...m, status: "cancelled" } : m)));
    setActioningId(null);
  }

  async function removeMember(id: string) {
    setRows((prev) => prev.filter((m) => m.id !== id));
    const supabase = createClient();
    await supabase.from("team_members").delete().eq("id", id);
    router.refresh();
  }

  async function togglePermission(id: string, key: keyof typeof permissions) {
    const member = rows.find((m) => m.id === id);
    if (!member) return;
    const value = !member[key];
    setRows((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
    const supabase = createClient();
    await supabase.from("team_members").update({ [key]: value }).eq("id", id);
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
            <Users className="h-5 w-5 text-gold-400" /> Team
          </h1>
          <p className="text-sm text-ink-400">
            Manage sales and marketing users on your account.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          Invite Member
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleInvite}
          className="space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-4"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              >
                <option>Sales</option>
                <option>Marketing</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {loading ? "Adding…" : "Add"}
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Permissions</label>
            <div className="flex gap-4">
              {permissionFields.map((p) => (
                <label key={p.key} className="flex items-center gap-1.5 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={permissions[p.key]}
                    onChange={(e) =>
                      setPermissions((prev) => ({ ...prev, [p.key]: e.target.checked }))
                    }
                    className="accent-gold-500"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}
        </form>
      )}

      <DataTable
        columns={[
          { header: "Name", render: (t) => <span className="font-medium text-ink-100">{t.name}</span> },
          { header: "Role", render: (t) => t.role },
          { header: "Email", render: (t) => t.email },
          {
            header: "Status",
            render: (t) => <Badge tone={statusTone[t.status]}>{t.status}</Badge>,
          },
          {
            header: "Permissions",
            render: (t) => (
              <div className="flex gap-3">
                {permissionFields.map((p) => (
                  <label key={p.key} className="flex items-center gap-1 text-xs text-ink-400">
                    <input
                      type="checkbox"
                      checked={t[p.key]}
                      onChange={() => togglePermission(t.id, p.key)}
                      className="accent-gold-500"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            ),
          },
          {
            header: "",
            render: (t) => (
              <div className="flex flex-wrap gap-2">
                {(t.status === "invited" || t.status === "failed" || t.status === "expired") && (
                  <button
                    disabled={actioningId === t.id}
                    onClick={() => resendInvite(t.invitation_id, t.id)}
                    className="text-xs font-medium text-gold-400 hover:text-gold-300 disabled:opacity-50"
                  >
                    Resend
                  </button>
                )}
                {(t.status === "invited" || t.status === "failed" || t.status === "expired") && (
                  <button
                    disabled={actioningId === t.id}
                    onClick={() => cancelInvite(t.invitation_id, t.id)}
                    className="text-xs font-medium text-ink-400 hover:text-ink-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => removeMember(t.id)}
                  className="text-xs font-medium text-rose-400 hover:text-rose-300"
                >
                  Remove
                </button>
              </div>
            ),
          },
        ]}
        rows={rows}
      />
    </div>
  );
}
