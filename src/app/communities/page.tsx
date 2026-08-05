import { PublicShell } from "@/components/public/PublicShell";
import { CommunitiesPageClient } from "@/components/public/CommunitiesPageClient";
import { ProjectAccessGate } from "@/components/public/ProjectAccessGate";
import { getCommunities, getMapAccessStatus, getPublishedProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage() {
  const { status: mapAccessStatus, subscriptionHref } = await getMapAccessStatus();
  const [communities, projects] = await Promise.all([
    getCommunities(),
    mapAccessStatus === "ok" ? getPublishedProjects() : Promise.resolve([]),
  ]);

  const stats = new Map<string, { count: number; totalPrice: number }>();
  for (const p of projects) {
    const entry = stats.get(p.community_id) ?? { count: 0, totalPrice: 0 };
    entry.count += 1;
    entry.totalPrice += p.price_from_aed;
    stats.set(p.community_id, entry);
  }

  const communitiesWithStats = communities.map((c) => {
    const stat = stats.get(c.id);
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      pinColor: c.pin_color,
      projectsCount: stat?.count ?? 0,
      avgPrice: stat ? stat.totalPrice / stat.count : 0,
      featured: c.featured,
      region: c.region,
    };
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink-100">Communities</h1>
        <p className="mt-1 text-sm text-ink-400">
          Explore {communities.length} master communities across Dubai.
        </p>

        <ProjectAccessGate status={mapAccessStatus} subscriptionHref={subscriptionHref} contentLabel="community project listings">
          <CommunitiesPageClient communities={communitiesWithStats} />
        </ProjectAccessGate>
      </div>
    </PublicShell>
  );
}
