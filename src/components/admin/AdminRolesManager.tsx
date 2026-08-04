"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { DataTable } from "@/components/ui/DataTable";
import { ADMIN_MODULES, type PermissionLevel } from "@/lib/permissions";

interface CustomRoleRow {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, PermissionLevel>;
  created_at: string;
}

const emptyForm = { name: "", description: "", permissions: {} as Record<string, PermissionLevel> };

// Grants access to whichever admin panel modules a full admin picks --
// see src/lib/permissions.ts for the module catalog and how a
// restricted admin (profiles.custom_role_id set) is actually gated.
// Existing, unrestricted admin accounts (custom_role_id null) are
// completely unaffected by anything created here.
export function AdminRolesManager({ roles }: { roles: CustomRoleRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(role: CustomRoleRow) {
    setEditingId(role.id);
    setForm({ name: role.name, description: role.description ?? "", permissions: { ...role.permissions } });
    setOpen(true);
  }

  function setModuleLevel(moduleKey: string, level: PermissionLevel | "none") {
    setForm((f) => {
      const next = { ...f.permissions };
      if (level === "none") delete next[moduleKey];
      else next[moduleKey] = level;
      return { ...f, permissions: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload = { name: form.name.trim(), description: form.description.trim() || null, permissions: form.permissions };

    const { data, error: saveError } = editingId
      ? await supabase.from("custom_roles").update(payload).eq("id", editingId).select().single()
      : await supabase.from("custom_roles").insert(payload).select().single();

    if (saveError || !data) {
      setError(saveError?.message ?? "Failed to save role.");
      setSaving(false);
      return;
    }

    await logAudit(editingId ? "custom_role.update" : "custom_role.create", "custom_role", data.id, { name: payload.name });
    setSaving(false);
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    router.refresh();
  }

  async function handleDelete(role: CustomRoleRow) {
    if (!window.confirm(`Delete the role "${role.name}"? Any admin currently assigned to it will lose all admin-panel access until reassigned.`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("custom_roles").delete().eq("id", role.id);
    if (deleteError) {
      window.alert("Failed to delete role — it may still be assigned to an admin account.");
      return;
    }
    await logAudit("custom_role.delete", "custom_role", role.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!open ? (
        <button
          onClick={startCreate}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> New Role
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-sm font-semibold text-ink-100">{editingId ? "Edit Role" : "New Role"}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Finance Officer"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Description (optional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Read-only access to payments and subscriptions"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-ink-400">
              Module Access — an admin assigned this role only sees the modules granted here.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ADMIN_MODULES.map((m) => (
                <div key={m.key} className="flex items-center justify-between gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2">
                  <span className="text-xs text-ink-300">{m.label}</span>
                  <select
                    value={form.permissions[m.key] ?? "none"}
                    onChange={(e) => setModuleLevel(m.key, e.target.value as PermissionLevel | "none")}
                    className="rounded-md border border-navy-600 bg-navy-800 px-1.5 py-1 text-xs text-ink-100 focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="view">View</option>
                    <option value="manage">Manage</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={[
          { header: "Name", render: (r) => <span className="font-medium text-ink-100">{r.name}</span> },
          { header: "Description", render: (r) => r.description ?? "—" },
          {
            header: "Modules",
            render: (r) => `${Object.keys(r.permissions ?? {}).length} of ${ADMIN_MODULES.length}`,
          },
          { header: "Created", render: (r) => new Date(r.created_at).toLocaleDateString() },
          {
            header: "",
            render: (r) => (
              <div className="flex gap-2">
                <button onClick={() => startEdit(r)} className="text-ink-400 hover:text-gold-400">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(r)} className="text-ink-400 hover:text-rose-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          },
        ]}
        rows={roles}
      />
      {roles.length === 0 && <p className="text-sm text-ink-500">No custom roles yet — every admin account has full access.</p>}
    </div>
  );
}
