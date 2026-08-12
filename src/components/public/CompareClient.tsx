"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, FolderOpen, Sparkles } from "lucide-react";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { CompactSelect } from "@/components/public/CompactSelect";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import { generateReferralQrCode } from "@/lib/referralQrCode";
import type { Project } from "@/types";

const MAX_SLOTS = 5;

// Presentation Studio 2.0, item 6 -- turns the current comparison into a
// real, shareable crm_collections row (the same table Collections/
// Presentations already use). Only present when this component is
// mounted from inside a portal (broker/salesperson/developer own
// /compare page) with the viewer's own owner id -- absent by default, so
// the fully public /compare page's behavior and bundle stay byte-for-byte
// unchanged for every existing visitor.
interface OwnerContext {
  ownerType: "broker" | "salesperson" | "developer";
  ownerId: string;
}

export function CompareClient({
  projects,
  ownerContext,
}: {
  projects: Project[];
  ownerContext?: OwnerContext;
}) {
  const { formatPrice } = useLocale();
  // Lets a project's Share menu link straight into a comparison that
  // already includes it (/compare?add=<slug>), instead of always landing
  // on an arbitrary first-3 selection the visitor has to fix themselves.
  const searchParams = useSearchParams();
  const addSlug = searchParams.get("add");

  const [slugs, setSlugs] = useState<string[]>(() => {
    const initial = projects.slice(0, 3).map((p) => p.slug);
    if (addSlug && projects.some((p) => p.slug === addSlug) && !initial.includes(addSlug)) {
      return [addSlug, ...initial].slice(0, MAX_SLOTS);
    }
    return initial;
  });
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [showPresentationForm, setShowPresentationForm] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState("");
  const [creatingPresentation, setCreatingPresentation] = useState(false);
  const [presentationToken, setPresentationToken] = useState<string | null>(null);
  const [presentationQrDataUrl, setPresentationQrDataUrl] = useState<string | null>(null);
  const [presentationLinkCopied, setPresentationLinkCopied] = useState(false);

  async function handleCreatePresentation(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerContext || !presentationTitle.trim() || selected.length === 0) return;
    setCreatingPresentation(true);
    const supabase = createClient();

    // Same insert shape as BrokerCollectionsClient.handleCreate (and its
    // salesperson/developer/agency siblings) -- hide_* all false and
    // mode "default" here since this quick path has no toggle UI of its
    // own; the agent can still edit them later from their Collections
    // page, this just gets a real, working link created fast.
    const basePayload = {
      owner_type: ownerContext.ownerType,
      [`${ownerContext.ownerType}_id`]: ownerContext.ownerId,
      client_id: null,
      title: presentationTitle.trim(),
    };
    const hidePayload = { hide_developer_name: false, hide_price: false, hide_location: false };

    let { data: collection, error } = await supabase
      .from("crm_collections")
      .insert({ ...basePayload, ...hidePayload, mode: "default" })
      .select("id, share_token")
      .single();

    // Same two-tier fallback as the Collections clients -- hide_*
    // (patch_134) and mode (patch_141) may not be migrated everywhere yet.
    if (error) {
      ({ data: collection, error } = await supabase
        .from("crm_collections")
        .insert({ ...basePayload, ...hidePayload })
        .select("id, share_token")
        .single());
    }
    if (error) {
      ({ data: collection, error } = await supabase
        .from("crm_collections")
        .insert(basePayload)
        .select("id, share_token")
        .single());
    }

    if (error || !collection) {
      setCreatingPresentation(false);
      return;
    }

    await supabase.from("crm_collection_items").insert(
      selected.map((p, i) => ({
        collection_id: collection.id,
        project_id: p.id,
        sort_order: i,
      }))
    );

    setPresentationToken(collection.share_token);
    setPresentationLinkCopied(false);
    setPresentationQrDataUrl(
      await generateReferralQrCode(`${window.location.origin}/present/${collection.share_token}`)
    );
    setCreatingPresentation(false);
  }

  async function handleCopyPresentationLink() {
    if (!presentationToken) return;
    await navigator.clipboard.writeText(`${window.location.origin}/present/${presentationToken}`);
    setPresentationLinkCopied(true);
  }

  async function getAiSummary() {
    setSummaryLoading(true);
    setSummaryError("");
    setSummary("");
    try {
      const res = await fetch("/api/assistant/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: selected.map((p) => ({
            name: p.name,
            developer: p.developerName ?? "—",
            community: p.communityName ?? "—",
            priceFromAed: p.priceFromAed,
            bedroomsFrom: p.bedroomsFrom,
            bedroomsTo: p.bedroomsTo,
            paymentPlan: p.paymentPlan,
            propertyType: p.propertyType,
            handoverQuarter: p.handoverQuarter || null,
            handoverYear: p.handoverYear || null,
            rating: p.rating > 0 ? p.rating : null,
            amenityCount: p.amenities.length,
          })),
        }),
      });
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setSummary(text);
      }
    } catch {
      setSummaryError("Couldn't generate a summary right now -- please try again.");
    } finally {
      setSummaryLoading(false);
    }
  }

  function updateSlot(index: number, slug: string) {
    setSlugs((prev) => {
      const next = [...prev];
      next[index] = slug;
      return next;
    });
  }

  function addSlot() {
    if (slugs.length >= MAX_SLOTS) return;
    const unused = projects.find((p) => !slugs.includes(p.slug));
    if (unused) setSlugs((prev) => [...prev, unused.slug]);
  }

  function removeSlot(index: number) {
    setSlugs((prev) => prev.filter((_, i) => i !== index));
  }

  const selected = slugs
    .map((s) => projects.find((p) => p.slug === s))
    .filter((p): p is Project => Boolean(p));

  const rows: { label: string; render: (p: Project) => React.ReactNode }[] = [
    { label: "Developer", render: (p) => p.developerName },
    { label: "Community", render: (p) => p.communityName },
    { label: "Price From", render: (p) => formatPrice(p.priceFromAed) },
    { label: "Payment Plan", render: (p) => p.paymentPlan },
    { label: "Bedrooms", render: (p) => `${p.bedroomsFrom} - ${p.bedroomsTo} BR` },
    { label: "Handover", render: (p) => `${p.handoverQuarter} ${p.handoverYear}` },
    { label: "Property Type", render: (p) => p.propertyType },
    { label: "Rating", render: (p) => (p.rating ? `${p.rating}★ (${p.reviews})` : "New") },
    { label: "Amenities", render: (p) => p.amenities.length },
  ];

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink-100">Compare Projects</h1>
        <p className="mt-4 text-sm text-ink-500">
          No published projects available to compare yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-100">Compare Projects</h1>
            <p className="mt-1 text-sm text-ink-400">
              Compare up to {MAX_SLOTS} projects side by side.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {ownerContext && selected.length >= 1 && (
              <button
                onClick={() => setShowPresentationForm((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm font-medium text-ink-100 hover:border-gold-500/60"
              >
                <FolderOpen className="h-4 w-4 text-gold-400" /> Create Presentation
              </button>
            )}
            {selected.length >= 2 && (
              <button
                onClick={getAiSummary}
                disabled={summaryLoading}
                className="flex items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm font-medium text-ink-100 hover:border-gold-500/60 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4 text-gold-400" />
                {summaryLoading ? "Summarizing…" : "AI Summary"}
              </button>
            )}
            {selected.length < MAX_SLOTS && selected.length < projects.length && (
              <button
                onClick={addSlot}
                className="rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
              >
                + Add Project
              </button>
            )}
          </div>
        </div>

        {showPresentationForm && ownerContext && (
          <div className="mt-4 rounded-xl border border-gold-500/30 bg-gold-500/[0.03] p-4">
            {presentationToken ? (
              <div className="flex flex-wrap items-center gap-4">
                {presentationQrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={presentationQrDataUrl}
                    alt="Share QR code"
                    className="h-20 w-20 rounded-lg border border-navy-600"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-semibold text-ink-100">Presentation created</p>
                  <p className="truncate text-xs text-ink-400">/present/{presentationToken}</p>
                  <button
                    onClick={handleCopyPresentationLink}
                    className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-2.5 py-1 text-xs font-medium text-ink-300 hover:text-ink-100"
                  >
                    {presentationLinkCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {presentationLinkCopied ? "Copied" : "Copy Link"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePresentation} className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
                  <input
                    required
                    value={presentationTitle}
                    onChange={(e) => setPresentationTitle(e.target.value)}
                    placeholder={`e.g. Comparison for ${selected[0]?.name ?? "your client"}`}
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingPresentation || !presentationTitle.trim()}
                  className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
                >
                  {creatingPresentation ? "Creating…" : "Create"}
                </button>
              </form>
            )}
            <p className="mt-2 text-[11px] text-ink-500">
              Turns the {selected.length} selected project{selected.length === 1 ? "" : "s"} into a shareable,
              branded presentation link -- manage it later from your Collections page.
            </p>
          </div>
        )}

        {(summary || summaryLoading || summaryError) && (
          <div className="mt-4 rounded-xl border border-navy-700 bg-navy-850 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold-400">
              <Sparkles className="h-3.5 w-3.5" /> AI Summary
            </p>
            {summaryError ? (
              <p className="text-sm text-rose-400">{summaryError}</p>
            ) : (
              <p className="text-sm text-ink-200">
                {summary || (summaryLoading ? "…" : "")}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-2">
            <thead>
              <tr>
                <th className="w-32" />
                {selected.map((p, i) => (
                  <th key={p.id} className="text-left">
                    <div className="rounded-xl border border-navy-700 bg-navy-850 p-3">
                      <ProjectThumb
                        gradient={p.gradient}
                        imageUrl={p.coverImageUrl}
                        imageAlt={p.name}
                        className="h-20 w-full rounded-lg"
                      />
                      <CompactSelect
                        label="Project"
                        hideLabel
                        allowClear={false}
                        placeholder={p.name}
                        value={p.slug}
                        onChange={(v) => v && updateSlot(i, v)}
                        options={projects.map((proj) => ({ label: proj.name, value: proj.slug }))}
                        className="mt-2"
                      />
                      {selected.length > 1 && (
                        <button
                          onClick={() => removeSlot(i)}
                          className="mt-1 text-[10px] font-medium text-ink-500 hover:text-rose-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="text-xs font-medium text-ink-500">
                    {row.label}
                  </td>
                  {selected.map((p) => (
                    <td
                      key={p.id}
                      className="rounded-lg border border-navy-800 bg-navy-850 px-3 py-2 text-ink-200"
                    >
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
}
