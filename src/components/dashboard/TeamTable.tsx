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
  status: "invited" | "active" | "removed";
  can_manage_projects: boolean;
  can_manage_leads: boolean;
  can_manage_billing: boolean;
}

const permissionFields = [
  { key: "can_manage_projects" as const, label: "Projects" },
  { key: "can_manage_leads" as const, label: "Leads" },
  { key: "can_manage_billing" as const, label: "Billing" },
];

export function TeamTable({
  developerId,
  members,
}: {
  developerId: string;
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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("team_members")
      .insert({
        developer_id: developerId,
        name,
        email,
        role,
        status: "invited",
        ...permissions,
      })
      .select()
      .single();

    if (!error && data) {
      setRows((prev) => [data, ...prev]);
      setName("");
      setEmail("");
      setShowForm(false);
    }
    setLoading(false);
    router.refresh();
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
        </form>
      )}

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
              <button
                onClick={() => removeMember(t.id)}
                className="text-xs font-medium text-rose-400 hover:text-rose-300"
              >
                Remove
              </button>
            ),
          },
        ]}
        rows={rows}
      />
    </div>
  );
}
