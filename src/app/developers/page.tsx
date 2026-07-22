import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { developers } from "@/data/mock";

export default function DevelopersPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink-100">Developers</h1>
        <p className="mt-1 text-sm text-ink-400">
          {developers.length} verified developers building across Dubai.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {developers.map((dev) => (
            <Link
              key={dev.id}
              href={`/developers/${dev.slug}`}
              className="rounded-xl border border-navy-700 bg-navy-850 p-5 transition-colors hover:border-gold-500/40"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-white"
                  style={{ background: dev.color }}
                >
                  {dev.initial}
                </div>
                <div>
                  <p className="flex items-center gap-1 text-sm font-semibold text-ink-100">
                    {dev.name}
                    {dev.verified && (
                      <BadgeCheck className="h-4 w-4 text-sky-400" />
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink-500">
                    <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                    {dev.rating} ({dev.reviews})
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-ink-400">
                {dev.description}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
                <span>{dev.projectsCount} Projects</span>
                <span>Since {dev.founded}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
