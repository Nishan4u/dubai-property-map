import { CommunityManager } from "@/components/admin/CommunityManager";
import { getAllProjectsAdmin, getCommunities } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminCommunitiesPage() {
  const [communities, projects] = await Promise.all([
    getCommunities(),
    getAllProjectsAdmin(),
  ]);

  const stats = new Map<string, { count: number; totalPrice: number }>();
  for (const p of projects) {
    const entry = stats.get(p.community_id) ?? { count: 0, totalPrice: 0 };
    entry.count += 1;
    entry.totalPrice += p.price_from_aed;
    stats.set(p.community_id, entry);
  }

  return (
    <div className="p-6">
      <CommunityManager communities={communities} stats={stats} />
    </div>
  );
}
