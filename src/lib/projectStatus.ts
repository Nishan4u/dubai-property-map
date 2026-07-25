import type { Project } from "@/types";

const currentYear = new Date().getFullYear();

// A handover more than 2 years out on an off-plan listing is treated as
// "future" — not yet under active construction.
export function isFutureProject(p: Project) {
  return p.listingType === "off-plan" && (p.handoverYear ?? 0) > currentYear + 2;
}

// Off-plan with a handover within 2 years is treated as actively "under
// construction". Both flags are derived from real listing_type/handover_year
// fields — nothing fabricated.
export function isConstructionProject(p: Project) {
  return (
    p.listingType === "off-plan" &&
    (p.handoverYear ?? 0) > 0 &&
    (p.handoverYear ?? 0) <= currentYear + 2
  );
}

export function getProjectStatusLabel(p: Project): string {
  if (p.listingType === "ready") return "Ready to move in";
  if (isFutureProject(p)) return "Future project — not yet under construction";
  if (isConstructionProject(p)) return "Under construction";
  return "Off-plan";
}
