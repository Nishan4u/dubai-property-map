"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import type { NavLinkRow } from "@/types/database";

function NavLinkSection({
  title,
  location,
  links: initialLinks,
}: {
  title: string;
  location: "header" | "footer";
  links: NavLinkRow[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!label.trim() || !url.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("nav_links")
      .insert({
        label: label.trim(),
        url: url.trim(),
        location,
        sort_order: links.length + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setLinks((prev) => [...prev, data]);
      await logAudit("nav_link.created", "nav_link", data.id, { label: label.trim(), location });
      setLabel("");
      setUrl("");
    }
    setSaving(false);
  }

  async function handleDelete(link: NavLinkRow) {
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    const supabase = createClient();
    await supabase.from("nav_links").delete().eq("id", link.id);
    await logAudit("nav_link.deleted", "nav_link", link.id, { label: link.label });
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <p className="mb-3 text-sm font-semibold text-ink-100">{title}</p>
      <ul className="mb-3 space-y-1.5">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm"
          >
            <span className="text-ink-200">
              {link.label}{" "}
              <span className="text-xs text-ink-500">{link.url}</span>
            </span>
            <button
              onClick={() => handleDelete(link)}
              className="text-ink-500 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {links.length === 0 && <p className="text-xs text-ink-500">No links yet.</p>}
      </ul>
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="w-32 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/path"
          className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

export function NavLinksManager({
  headerLinks,
  footerLinks,
}: {
  headerLinks: NavLinkRow[];
  footerLinks: NavLinkRow[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NavLinkSection title="Header Menu" location="header" links={headerLinks} />
      <NavLinkSection title="Footer Menu" location="footer" links={footerLinks} />
    </div>
  );
}
