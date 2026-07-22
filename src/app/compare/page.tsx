"use client";

import { useState } from "react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import {
  formatAed,
  getCommunity,
  getDeveloper,
  projects,
} from "@/data/mock";

const MAX_SLOTS = 5;

export default function ComparePage() {
  const [slugs, setSlugs] = useState<string[]>([
    projects[0].slug,
    projects[1].slug,
    projects[3].slug,
  ]);

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
    .filter((p): p is (typeof projects)[number] => Boolean(p));

  const rows: { label: string; render: (p: (typeof projects)[number]) => React.ReactNode }[] = [
    { label: "Developer", render: (p) => getDeveloper(p.developerId)?.name },
    { label: "Community", render: (p) => getCommunity(p.communityId)?.name },
    { label: "Price From", render: (p) => formatAed(p.priceFromAed) },
    { label: "Payment Plan", render: (p) => p.paymentPlan },
    { label: "Bedrooms", render: (p) => `${p.bedroomsFrom} - ${p.bedroomsTo} BR` },
    { label: "Handover", render: (p) => `${p.handoverQuarter} ${p.handoverYear}` },
    { label: "Property Type", render: (p) => p.propertyType },
    { label: "Rating", render: (p) => (p.rating ? `${p.rating}★ (${p.reviews})` : "New") },
    { label: "Amenities", render: (p) => p.amenities.length },
  ];

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-100">Compare Projects</h1>
            <p className="mt-1 text-sm text-ink-400">
              Compare up to {MAX_SLOTS} projects side by side.
            </p>
          </div>
          {selected.length < MAX_SLOTS && (
            <button
              onClick={addSlot}
              className="rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
            >
              + Add Project
            </button>
          )}
        </div>

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
                        className="h-20 w-full rounded-lg"
                      />
                      <select
                        value={p.slug}
                        onChange={(e) => updateSlot(i, e.target.value)}
                        className="mt-2 w-full rounded-lg border border-navy-600 bg-navy-800 px-2 py-1.5 text-xs text-ink-100"
                      >
                        {projects.map((proj) => (
                          <option key={proj.id} value={proj.slug}>
                            {proj.name}
                          </option>
                        ))}
                      </select>
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
    </PublicShell>
  );
}
