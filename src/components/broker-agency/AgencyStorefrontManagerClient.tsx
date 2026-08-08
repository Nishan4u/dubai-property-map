"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SectionCard } from "@/components/ui/SectionCard";

interface StorefrontItem {
  id: string;
  project_id: string;
  sort_order: number;
}

// Mirrors AgencyCollectionsClient.tsx's checkbox project-picker shape,
// minus the client-picker/hide-toggle/share-token parts -- those are
// specific to a private, client-directed Collection, not this public,
// persistent, agency-wide storefront (see supabase/patch_135_agency_
// storefront.sql's header comment for why it's a separate table).
export function AgencyStorefrontManagerClient({
  brokerageId,
  subdomain,
  items: initialItems,
  projects,
}: {
  brokerageId: string;
  subdomain: string | null;
  items: StorefrontItem[];
  projects: { id: string; name: string }[];
}) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(initialItems.map((i) => i.project_id));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggleProject(id: string) {
    setSelectedProjectIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const supabase = createClient();

    // Simplest correct approach for a small, infrequently-edited list:
    // replace the whole set rather than diffing -- mirrors how
    // AgencyCollectionsClient.tsx replaces crm_collection_items wholesale
    // on every save rather than tracking incremental add/remove.
    const { error: deleteError } = await supabase.from("brokerage_storefront_items").delete().eq("brokerage_id", brokerageId);
    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    if (selectedProjectIds.length > 0) {
      const { error: insertError } = await supabase.from("brokerage_storefront_items").insert(
        selectedProjectIds.map((projectId, i) => ({
          brokerage_id: brokerageId,
          project_id: projectId,
          sort_order: i,
        }))
      );
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaved(true);
    setSaving(false);
  }

  return (
    <SectionCard title="Storefront">
      {!subdomain ? (
        <p className="text-sm text-ink-400">
          Set a subdomain on your{" "}
          <a href="/broker-agency/profile" className="text-gold-400 hover:text-gold-300">
            Profile page
          </a>{" "}
          first, then pick which properties show here.
        </p>
      ) : (
        <>
          <p className="mb-3 flex items-center gap-1.5 text-sm text-ink-400">
            <Store className="h-4 w-4 text-gold-400" />
            Live at{" "}
            <a
              href={`https://${subdomain}.dubaipropertymap.ae`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 hover:text-gold-300"
            >
              {subdomain}.dubaipropertymap.ae
            </a>
          </p>
          <p className="mb-2 text-xs font-medium text-ink-400">
            Featured properties ({selectedProjectIds.length} selected)
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-navy-600 bg-navy-800 p-2">
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
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saved && <span className="text-xs font-medium text-emerald-400">Saved.</span>}
            {error && <span className="text-xs font-medium text-rose-400">{error}</span>}
          </div>
        </>
      )}
    </SectionCard>
  );
}
