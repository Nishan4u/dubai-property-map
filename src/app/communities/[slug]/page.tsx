import { notFound } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectCard } from "@/components/public/ProjectCard";
import {
  communities,
  formatAed,
  getCommunity,
  projectsForCommunity,
} from "@/data/mock";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = getCommunity(slug);
  if (!community) notFound();

  const communityProjects = projectsForCommunity(community.id);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: community.pinColor }}
              />
              {community.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-400">
              {community.description}
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-lg font-bold text-ink-100">
                {community.projectsCount}
              </p>
              <p className="text-xs text-ink-500">Projects</p>
            </div>
            <div>
              <p className="text-lg font-bold text-ink-100">
                {formatAed(community.avgPriceAed)}
              </p>
              <p className="text-xs text-ink-500">Avg Price</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-lg font-bold text-emerald-400">
                <TrendingUp className="h-4 w-4" /> {community.priceTrendPct}%
              </p>
              <p className="text-xs text-ink-500">YoY Trend</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {["Schools", "Hospitals", "Transport"].map((cat) => (
            <div
              key={cat}
              className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-sm text-ink-400"
            >
              <p className="mb-1 font-semibold text-ink-100">{cat}</p>
              Nearby {cat.toLowerCase()} data coming soon in this prototype.
            </div>
          ))}
        </div>

        <h2 className="mt-8 mb-3 text-lg font-semibold text-ink-100">
          Projects in {community.name}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {communityProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {communityProjects.length === 0 && (
            <p className="text-sm text-ink-500">
              No active projects listed yet.
            </p>
          )}
        </div>
      </div>
    </PublicShell>
  );
}

export function generateStaticParams() {
  return communities.map((c) => ({ slug: c.slug }));
}
