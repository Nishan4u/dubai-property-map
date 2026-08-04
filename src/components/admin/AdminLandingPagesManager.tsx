"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";

interface LandingPageRow {
  id: string;
  slug: string;
  title: string;
  hero_image_url: string | null;
  body: string;
  cta_text: string | null;
  cta_url: string | null;
  published: boolean;
  created_at: string;
}

const emptyForm = { slug: "", title: "", heroImageUrl: "", body: "", ctaText: "", ctaUrl: "", published: false };

export function AdminLandingPagesManager({ pages }: { pages: LandingPageRow[] }) {
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

  function startEdit(page: LandingPageRow) {
    setEditingId(page.id);
    setForm({
      slug: page.slug,
      title: page.title,
      heroImageUrl: page.hero_image_url ?? "",
      body: page.body,
      ctaText: page.cta_text ?? "",
      ctaUrl: page.cta_url ?? "",
      published: page.published,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.slug.trim() || !form.title.trim() || !form.body.trim()) return;

    setSaving(true);
    setError("");
    const supabase = createClient();
    const payload = {
      slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      title: form.title.trim(),
      hero_image_url: form.heroImageUrl.trim() || null,
      body: form.body.trim(),
      cta_text: form.ctaText.trim() || null,
      cta_url: form.ctaUrl.trim() || null,
      published: form.published,
    };

    const { data, error: saveError } = editingId
      ? await supabase.from("landing_pages").update(payload).eq("id", editingId).select().single()
      : await supabase.from("landing_pages").insert(payload).select().single();

    if (saveError || !data) {
      setError(saveError?.message ?? "Failed to save landing page.");
      setSaving(false);
      return;
    }

    await logAudit(editingId ? "landing_page.update" : "landing_page.create", "landing_page", data.id, {
      slug: payload.slug,
    });
    setSaving(false);
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    router.refresh();
  }

  async function handleDelete(page: LandingPageRow) {
    if (!window.confirm(`Delete the landing page "${page.title}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("landing_pages").delete().eq("id", page.id);
    if (deleteError) {
      window.alert("Failed to delete landing page.");
      return;
    }
    await logAudit("landing_page.delete", "landing_page", page.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!open ? (
        <button
          onClick={startCreate}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> New Landing Page
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4 sm:grid-cols-2"
        >
          <p className="text-sm font-semibold text-ink-100 sm:col-span-2">
            {editingId ? "Edit Landing Page" : "New Landing Page"}
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Downtown Dubai Off-Plan Launch"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Slug (page at /l/…)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="e.g. downtown-launch"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-400">Hero Image URL (optional)</label>
            <input
              value={form.heroImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, heroImageUrl: e.target.value }))}
              placeholder="https://…"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-400">Body</label>
            <textarea
              rows={5}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Plain text — separate paragraphs with a blank line."
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">CTA Text (optional)</label>
            <input
              value={form.ctaText}
              onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
              placeholder="e.g. Register Your Interest"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">CTA URL (optional)</label>
            <input
              value={form.ctaUrl}
              onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
              placeholder="https://…"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-ink-400 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="h-3.5 w-3.5 rounded border-navy-600 bg-navy-800"
            />
            Published (live at /l/{form.slug || "…"})
          </label>

          {error && <p className="text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>}

          <div className="flex gap-2 sm:col-span-2">
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
          { header: "Title", render: (p) => <span className="font-medium text-ink-100">{p.title}</span> },
          { header: "Slug", render: (p) => <span className="font-mono text-xs text-ink-400">/l/{p.slug}</span> },
          {
            header: "Status",
            render: (p) => <Badge tone={p.published ? "green" : "neutral"}>{p.published ? "Published" : "Draft"}</Badge>,
          },
          { header: "Created", render: (p) => new Date(p.created_at).toLocaleDateString() },
          {
            header: "",
            render: (p) => (
              <div className="flex gap-2">
                <button onClick={() => startEdit(p)} className="text-ink-400 hover:text-gold-400">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(p)} className="text-ink-400 hover:text-rose-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          },
        ]}
        rows={pages}
      />
      {pages.length === 0 && <p className="text-sm text-ink-500">No landing pages yet.</p>}
    </div>
  );
}
