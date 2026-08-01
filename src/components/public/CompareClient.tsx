"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { CompactSelect } from "@/components/public/CompactSelect";
import { formatAed } from "@/data/mock";
import type { Project } from "@/types";

const MAX_SLOTS = 5;

export function CompareClient({ projects }: { projects: Project[] }) {
  const [slugs, setSlugs] = useState<string[]>(
    projects.slice(0, 3).map((p) => p.slug)
  );
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

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
    { label: "Price From", render: (p) => formatAed(p.priceFromAed) },
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
