"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { formatAed } from "@/data/mock";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import type { CommunityRow } from "@/types/database";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyDraft = {
  name: "",
  description: "",
  pin_color: "#3b82f6",
  lat: "",
  lng: "",
  meta_title: "",
  meta_description: "",
  boundary_radius_km: "",
  featured: false,
};

export function CommunityManager({
  communities: initialCommunities,
  stats,
}: {
  communities: CommunityRow[];
  stats: Map<string, { count: number; totalPrice: number }>;
}) {
  const [communities, setCommunities] = useState(initialCommunities);
  const [editing, setEditing] = useState<CommunityRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditing(null);
    setDraft(emptyDraft);
    setShowForm(true);
  }

  function openEdit(c: CommunityRow) {
    setEditing(c);
    setDraft({
      name: c.name,
      description: c.description ?? "",
      pin_color: c.pin_color,
      lat: c.lat?.toString() ?? "",
      lng: c.lng?.toString() ?? "",
      meta_title: c.meta_title ?? "",
      meta_description: c.meta_description ?? "",
      boundary_radius_km: c.boundary_radius_km?.toString() ?? "",
      featured: c.featured,
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: draft.name,
      description: draft.description || null,
      pin_color: draft.pin_color,
      lat: draft.lat ? Number(draft.lat) : null,
      lng: draft.lng ? Number(draft.lng) : null,
      meta_title: draft.meta_title || null,
      meta_description: draft.meta_description || null,
      boundary_radius_km: draft.boundary_radius_km ? Number(draft.boundary_radius_km) : null,
      featured: draft.featured,
    };

    if (editing) {
      const { data, error } = await supabase
        .from("communities")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      if (!error && data) {
        setCommunities((prev) => prev.map((c) => (c.id === editing.id ? data : c)));
        await logAudit("community.updated", "community", editing.id, { name: draft.name });
      }
    } else {
      const slug = `${slugify(draft.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase
        .from("communities")
        .insert({ ...payload, slug })
        .select()
        .single();
      if (!error && data) {
        setCommunities((prev) => [...prev, data]);
        await logAudit("community.created", "community", data.id, { name: draft.name });
      }
    }
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(c: CommunityRow) {
    const count = stats.get(c.id)?.count ?? 0;
    if (count > 0) {
      alert(`Can't delete "${c.name}" — it still has ${count} project(s) assigned to it.`);
      return;
    }
    if (!confirm(`Delete community "${c.name}"? This can't be undone.`)) return;
    setCommunities((prev) => prev.filter((x) => x.id !== c.id));
    const supabase = createClient();
    await supabase.from("communities").delete().eq("id", c.id);
    await logAudit("community.deleted", "community", c.id, { name: c.name });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-100">Communities</h1>
          <p className="text-sm text-ink-400">
            Manage master communities shown on the interactive map.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> Add Community
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-sm font-semibold text-ink-100">
            {editing ? `Edit ${editing.name}` : "Add Community"}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
            <Field
              label="Pin Color"
              type="color"
              value={draft.pin_color}
              onChange={(v) => setDraft((d) => ({ ...d, pin_color: v }))}
            />
            <Field
              label="Boundary Radius (km)"
              type="number"
              value={draft.boundary_radius_km}
              onChange={(v) => setDraft((d) => ({ ...d, boundary_radius_km: v }))}
              placeholder="e.g. 2.5"
            />
            <Field
              label="Latitude"
              type="number"
              value={draft.lat}
              onChange={(v) => setDraft((d) => ({ ...d, lat: v }))}
            />
            <Field
              label="Longitude"
              type="number"
              value={draft.lng}
              onChange={(v) => setDraft((d) => ({ ...d, lng: v }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Description</label>
            <textarea
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div className="border-t border-navy-800 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              SEO
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Meta Title"
                value={draft.meta_title}
                onChange={(v) => setDraft((d) => ({ ...d, meta_title: v }))}
                placeholder="Shown in search engine results"
              />
              <Field
                label="Meta Description"
                value={draft.meta_description}
                onChange={(v) => setDraft((d) => ({ ...d, meta_description: v }))}
                placeholder="Shown in search engine results"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-300">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
              className="accent-gold-500"
            />
            Sponsored — shown first with a badge on the Communities page
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !draft.name}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={[
          {
            header: "Community",
            render: (c) => (
              <span className="flex items-center gap-2 font-medium text-ink-100">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.pin_color }} />
                {c.name}
              </span>
            ),
          },
          { header: "Projects", render: (c) => stats.get(c.id)?.count ?? 0 },
          {
            header: "Avg. Price",
            render: (c) => {
              const s = stats.get(c.id);
              return s && s.count > 0 ? formatAed(s.totalPrice / s.count) : "—";
            },
          },
          {
            header: "SEO",
            render: (c) => (c.meta_title ? "✓" : "—"),
          },
          {
            header: "Sponsored",
            render: (c) => (c.featured ? "✓" : "—"),
          },
          {
            header: "",
            render: (c) => (
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(c)}
                  className="text-xs font-medium text-gold-400 hover:text-gold-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={communities}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
    </div>
  );
}
