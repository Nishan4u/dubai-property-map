import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
}) {
  const positive = delta?.trim().startsWith("+");
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-400">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-ink-500" />}
      </div>
      <div className="mt-2 text-2xl font-semibold text-ink-100">{value}</div>
      {delta && (
        <div
          className={clsx(
            "mt-1 text-xs font-medium",
            positive ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
