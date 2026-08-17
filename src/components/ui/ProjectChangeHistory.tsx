import { History } from "lucide-react";

export interface ProjectChangeLogEntry {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string;
  confidence: number | null;
  applied: boolean;
  created_at: string;
}

const FIELD_LABELS: Record<string, string> = {
  constructionProgressPercent: "Construction Progress",
  priceFromAed: "Starting Price",
  handoverQuarter: "Handover Quarter",
  handoverYear: "Handover Year",
  paymentPlan: "Payment Plan",
};

function formatValue(field: string, value: string | null): string {
  if (value === null || value === "") return "—";
  if (field === "constructionProgressPercent") return `${value}%`;
  if (field === "priceFromAed") {
    const n = Number(value);
    return Number.isFinite(n) ? `AED ${n.toLocaleString()}` : value;
  }
  return value;
}

/**
 * Renders a web_discovery project's AI Discovery change history
 * (patch_151 -- the daily refresh cycle re-checking already-discovered
 * projects for real field changes). Used on both the public project
 * page and the admin project editor, hence living in components/ui
 * rather than components/public or components/dashboard.
 *
 * `mode` only changes DISPLAY, never what data can appear here -- a
 * public caller only ever receives applied=true rows in the first
 * place (getProjectChangeLog's RLS-scoped query narrows that before
 * this component sees anything), so there's no risk of a low-
 * confidence proposed change leaking to a visitor. Admin mode also
 * surfaces detected-but-not-applied entries and why they weren't.
 */
export function ProjectChangeHistory({
  changes,
  mode = "public",
  title,
}: {
  changes: ProjectChangeLogEntry[];
  mode?: "public" | "admin";
  title?: string;
}) {
  if (changes.length === 0) return null;

  return (
    <div className="space-y-2">
      {title && (
        <div className="flex items-center gap-2 text-ink-200">
          <History className="h-4 w-4" />
          <p className="text-sm font-semibold">{title}</p>
        </div>
      )}
      <ul className="space-y-2">
        {changes.map((c) => (
          <li key={c.id} className="rounded-lg border border-navy-700 bg-navy-850 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-ink-200">{FIELD_LABELS[c.field_name] ?? c.field_name}</p>
              <span className="text-xs text-ink-500">
                {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <p className="mt-1 text-ink-400">
              {formatValue(c.field_name, c.old_value)} <span className="text-ink-600">&rarr;</span>{" "}
              <span className={c.applied ? "font-medium text-gold-400" : "text-ink-300"}>
                {formatValue(c.field_name, c.new_value)}
              </span>
            </p>
            {mode === "admin" && !c.applied && (
              <p className="mt-1 text-xs text-ink-500">
                Detected, not applied ({c.confidence ?? 0}% confidence -- below the auto-apply threshold)
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
