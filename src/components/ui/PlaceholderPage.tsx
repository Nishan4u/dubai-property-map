import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

export function PlaceholderPage({
  title,
  description,
  icon: Icon = Construction,
  bullets,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  bullets?: string[];
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="max-w-md rounded-2xl border border-navy-700 bg-navy-850 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-ink-100">{title}</h2>
        <p className="mt-2 text-sm text-ink-400">{description}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-left text-sm text-ink-300">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                {b}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-5 inline-block rounded-full bg-navy-700 px-3 py-1 text-xs font-medium text-ink-400">
          Coming soon in this prototype
        </span>
      </div>
    </div>
  );
}
