import { notFound } from "next/navigation";
import { BadgeCheck, Star } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectCard } from "@/components/public/ProjectCard";
import { getDeveloper, projectsForDeveloper, developers } from "@/data/mock";

export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const developer = getDeveloper(slug);
  if (!developer) notFound();

  const devProjects = projectsForDeveloper(developer.id);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{ background: developer.color }}
          >
            {developer.initial}
          </div>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
              {developer.name}
              {developer.verified && (
                <BadgeCheck className="h-5 w-5 text-sky-400" />
              )}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-400">
              <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
              {developer.rating} · {developer.reviews} reviews · Since{" "}
              {developer.founded}
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <Stat label="Projects" value={developer.projectsCount} />
            <Stat label="Completed" value={developer.completedCount} />
            <Stat
              label="Under Construction"
              value={developer.underConstructionCount}
            />
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-300">
          {developer.description}
        </p>

        <h2 className="mt-8 mb-3 text-lg font-semibold text-ink-100">
          Projects by {developer.name}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {devProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {devProjects.length === 0 && (
            <p className="text-sm text-ink-500">No active projects listed.</p>
          )}
        </div>
      </div>
    </PublicShell>
  );
}

export function generateStaticParams() {
  return developers.map((d) => ({ slug: d.slug }));
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-bold text-ink-100">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
