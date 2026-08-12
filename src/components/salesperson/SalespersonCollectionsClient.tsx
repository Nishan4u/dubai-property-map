"use client";

import { useState } from "react";
import { Check, Copy, Eye, FolderOpen, MessageCircle, Share2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SectionCard } from "@/components/ui/SectionCard";
import { generateReferralQrCode } from "@/lib/referralQrCode";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import type { CrmClientRow } from "@/lib/supabase/queries";

interface Collection {
  id: string;
  title: string;
  share_token: string;
  client_id: string | null;
  created_at: string;
  crm_clients: { full_name: string } | { full_name: string }[] | null;
  crm_collection_items: { count: number }[] | { count: number } | null;
  // Absent (not just 0) on an environment that hasn't run patch_140 yet --
  // getCollections() falls back to a select without this column rather
  // than breaking the whole page, so this must stay optional here too.
  crm_collection_views?: { count: number }[] | { count: number } | null;
}

function itemCount(c: Collection): number {
  const items = Array.isArray(c.crm_collection_items) ? c.crm_collection_items[0] : c.crm_collection_items;
  return items?.count ?? 0;
}

function viewCount(c: Collection): number {
  const views = Array.isArray(c.crm_collection_views) ? c.crm_collection_views[0] : c.crm_collection_views;
  return views?.count ?? 0;
}

// Mirrors src/components/broker/BrokerCollectionsClient.tsx -- see it
// for context. Kept as its own copy rather than a shared component
// since broker/salesperson portals are otherwise fully separate
// component trees in this codebase.
export function SalespersonCollectionsClient({
  salespersonId,
  collections: initialCollections,
  clients,
  projects,
  lastViewedAt = {},
}: {
  salespersonId: string;
  collections: Collection[];
  clients: CrmClientRow[];
  projects: { id: string; name: string }[];
  lastViewedAt?: Record<string, string>;
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  // "Hide info to prompt engagement" toggles -- the buyer sees "Contact
  // agent" instead of the real value and has to reach out, matching the
  // same tactic real estate presentation tools (e.g. Reelly) offer.
  const [hideDeveloperName, setHideDeveloperName] = useState(false);
  const [hidePrice, setHidePrice] = useState(false);
  const [hideLocation, setHideLocation] = useState(false);
  // Presentation Studio 2.0 mode (patch_141) -- purely a client-side
  // rendering directive on /present/[token], see PresentationClient.tsx.
  const [mode, setMode] = useState("default");
  const [saving, setSaving] = useState(false);
  const [shareOpenId, setShareOpenId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleProject(id: string) {
    setSelectedProjectIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || selectedProjectIds.length === 0) return;
    setSaving(true);
    const supabase = createClient();

    const basePayload = {
      owner_type: "salesperson",
      salesperson_id: salespersonId,
      client_id: clientId || null,
      title: title.trim(),
    };

    const hidePayload = { hide_developer_name: hideDeveloperName, hide_price: hidePrice, hide_location: hideLocation };

    let { data: collection, error } = await supabase
      .from("crm_collections")
      .insert({ ...basePayload, ...hidePayload, mode })
      .select("*, crm_clients(full_name)")
      .single();

    // hide_* (patch_134) and mode (patch_141) are both newer additions
    // that may not be migrated on every environment yet -- Postgres
    // errors on the whole insert when it references an unknown column,
    // which would otherwise break collection creation entirely until the
    // migration runs. Two retry tiers, dropping the newest column first,
    // so an environment with hide_* but not yet `mode` still gets the
    // already-shipped hide_* toggles instead of losing both at once.
    if (error) {
      ({ data: collection, error } = await supabase
        .from("crm_collections")
        .insert({ ...basePayload, ...hidePayload })
        .select("*, crm_clients(full_name)")
        .single());
    }
    if (error) {
      ({ data: collection, error } = await supabase
        .from("crm_collections")
        .insert(basePayload)
        .select("*, crm_clients(full_name)")
        .single());
    }

    if (error || !collection) {
      setSaving(false);
      return;
    }

    await supabase.from("crm_collection_items").insert(
      selectedProjectIds.map((projectId, i) => ({
        collection_id: collection.id,
        project_id: projectId,
        sort_order: i,
      }))
    );

    setCollections((prev) => [{ ...collection, crm_collection_items: [{ count: selectedProjectIds.length }] }, ...prev]);
    setShowForm(false);
    setTitle("");
    setClientId("");
    setSelectedProjectIds([]);
    setHideDeveloperName(false);
    setHidePrice(false);
    setHideLocation(false);
    setMode("default");
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this collection? The share link will stop working.")) return;
    setCollections((prev) => prev.filter((c) => c.id !== id));
    const supabase = createClient();
    await supabase.from("crm_collections").delete().eq("id", id);
  }

  async function toggleShare(collection: Collection) {
    if (shareOpenId === collection.id) {
      setShareOpenId(null);
      return;
    }
    setShareOpenId(collection.id);
    setCopied(false);
    const url = `${window.location.origin}/present/${collection.share_token}`;
    setQrDataUrl(await generateReferralQrCode(url));
  }

  async function handleCopy(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/present/${token}`);
    setCopied(true);
  }

  return (
    <SectionCard
      title="Collections"
      action={
        !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-medium text-gold-400 hover:text-gold-300">
            + New Collection
          </button>
        )
      }
    >
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 space-y-3 rounded-lg border border-navy-700 bg-navy-900 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Villas shortlist for the Khan family"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Client (optional)</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Projects ({selectedProjectIds.length} selected)
            </label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-navy-600 bg-navy-800 p-2">
              {projects.map((p) => (
                <label key={p.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink-200 hover:bg-navy-700">
                  <input
                    type="checkbox"
                    checked={selectedProjectIds.includes(p.id)}
                    onChange={() => toggleProject(p.id)}
                    className="accent-gold-500"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Hide info to prompt engagement (optional)
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-navy-600 bg-navy-800 p-2.5">
              <label className="flex items-center gap-1.5 text-xs text-ink-200">
                <input
                  type="checkbox"
                  checked={hideDeveloperName}
                  onChange={(e) => setHideDeveloperName(e.target.checked)}
                  className="accent-gold-500"
                />
                Hide developer name
              </label>
              <label className="flex items-center gap-1.5 text-xs text-ink-200">
                <input
                  type="checkbox"
                  checked={hidePrice}
                  onChange={(e) => setHidePrice(e.target.checked)}
                  className="accent-gold-500"
                />
                Hide price
              </label>
              <label className="flex items-center gap-1.5 text-xs text-ink-200">
                <input
                  type="checkbox"
                  checked={hideLocation}
                  onChange={(e) => setHideLocation(e.target.checked)}
                  className="accent-gold-500"
                />
                Hide location
              </label>
            </div>
            <p className="mt-1 text-[11px] text-ink-500">
              Hidden fields show as &quot;Contact agent&quot; on the shared link, so the buyer has to reach out to you.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Presentation mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            >
              <option value="default">Default -- everything, natural order</option>
              <option value="investor">Investor -- pricing &amp; payment plan first</option>
              <option value="end_user">End User -- location &amp; lifestyle first</option>
              <option value="quick_pitch">Quick Pitch -- projects only, no extra sections</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || selectedProjectIds.length === 0}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create Collection"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {collections.length === 0 ? (
        <p className="text-sm text-ink-500">No collections yet.</p>
      ) : (
        <div className="space-y-1.5">
          {collections.map((c) => {
            const client = Array.isArray(c.crm_clients) ? c.crm_clients[0] : c.crm_clients;
            return (
              <div key={c.id} className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 shrink-0 text-gold-400" />
                    <div>
                      <p className="text-ink-100">
                        {c.title} {client && <span className="text-ink-500">· {client.full_name}</span>}
                      </p>
                      <p className="text-xs text-ink-500">
                        {itemCount(c)} project{itemCount(c) === 1 ? "" : "s"}
                        {" · "}
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Opened {viewCount(c)} time{viewCount(c) === 1 ? "" : "s"}
                        </span>
                        {lastViewedAt[c.id] && ` · Last viewed ${new Date(lastViewedAt[c.id]).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleShare(c)}
                      className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Share
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-ink-600 hover:text-rose-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {shareOpenId === c.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-navy-800 pt-3">
                    {qrDataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrl} alt="Share QR code" className="h-20 w-20 rounded-lg border border-navy-600" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-xs text-ink-400">/present/{c.share_token}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleCopy(c.share_token)}
                          className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-2.5 py-1 text-xs font-medium text-ink-300 hover:text-ink-100"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Copied" : "Copy Link"}
                        </button>
                        <a
                          href={getWhatsAppUrl(
                            "",
                            `${c.title}: ${window.location.origin}/present/${c.share_token}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-2.5 py-1 text-xs font-medium text-ink-300 hover:text-ink-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Share via WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
