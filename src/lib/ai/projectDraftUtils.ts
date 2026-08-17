// Shared helpers for any route that drafts a `projects` row from AI-
// extracted data. Extracted from extract-brochure/route.ts (patch_149)
// once a second caller (the AI Discovery ingest route, patch_150)
// needed the exact same logic -- two real callers is the threshold
// this codebase extracts shared code at, not speculative reuse.

export const DRAFT_PROJECT_GRADIENTS = [
  "from-amber-500/40 via-slate-800 to-slate-950",
  "from-sky-500/40 via-slate-800 to-slate-950",
  "from-emerald-500/40 via-slate-800 to-slate-950",
  "from-fuchsia-500/40 via-slate-800 to-slate-950",
  "from-rose-500/40 via-slate-800 to-slate-950",
  "from-indigo-500/40 via-slate-800 to-slate-950",
];

export function pickGradient(): string {
  return DRAFT_PROJECT_GRADIENTS[Math.floor(Math.random() * DRAFT_PROJECT_GRADIENTS.length)];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Exact match, then case-insensitive substring -- deliberately the ONLY
 * two-step (non-exact) matcher used anywhere in this codebase's AI-
 * sourced-data paths, and scoped to community matching only. Every
 * other entity-identity match (developer, project) stays exact-only --
 * this codebase has its own documented history of a fuzzy-matching
 * false positive (patch_90's comment: bare "Dubai" once matched
 * "Dubai Land Residence Complex") -- don't widen this pattern to new
 * callers without re-reading that lesson first.
 */
export function matchCommunity(
  guess: string | null | undefined,
  communities: { id: string; name: string }[]
): { id: string; name: string } | null {
  const g = (guess ?? "").trim().toLowerCase();
  if (!g) return null;
  return (
    communities.find((c) => c.name.toLowerCase() === g) ??
    communities.find((c) => c.name.toLowerCase().includes(g) || g.includes(c.name.toLowerCase())) ??
    null
  );
}
