import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { communities, formatAed } from "@/data/mock";

export default function CommunitiesPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink-100">Communities</h1>
        <p className="mt-1 text-sm text-ink-400">
          Explore {communities.length} master communities across Dubai.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => (
            <Link
              key={c.id}
              href={`/communities/${c.slug}`}
              className="rounded-xl border border-navy-700 bg-navy-850 p-5 transition-colors hover:border-gold-500/40"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: c.pinColor }}
                />
                <h3 className="text-sm font-semibold text-ink-100">
                  {c.name}
                </h3>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-ink-400">
                {c.description}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-ink-500">
                  {c.projectsCount} Projects · Avg {formatAed(c.avgPriceAed)}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="h-3 w-3" /> {c.priceTrendPct}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
