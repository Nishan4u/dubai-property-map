import { PublicShell } from "@/components/public/PublicShell";
import { DevelopersPageClient } from "@/components/public/DevelopersPageClient";
import { getDevelopers, getPublishedProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DevelopersPage() {
  const [developers, projects] = await Promise.all([
    getDevelopers(),
    getPublishedProjects(),
  ]);

  const projectCounts = new Map<string, number>();
  for (const p of projects) {
    projectCounts.set(p.developer_id, (projectCounts.get(p.developer_id) ?? 0) + 1);
  }

  const developersWithCount = developers.map((dev) => ({
    id: dev.id,
    slug: dev.slug,
    name: dev.name,
    description: dev.description,
    logoUrl: dev.logo_url,
    color: dev.color,
    initial: dev.initial,
    verified: dev.verified,
    founded: dev.founded,
    projectsCount: projectCounts.get(dev.id) ?? 0,
  }));

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink-100">Developers</h1>
        <p className="mt-1 text-sm text-ink-400">
          {developers.length} verified developers building across Dubai.
        </p>

        <DevelopersPageClient developers={developersWithCount} />
      </div>
    </PublicShell>
  );
}
