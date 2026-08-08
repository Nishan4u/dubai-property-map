import { BrokerProjectsManager } from "@/components/broker/BrokerProjectsManager";
import {
  getBrokerProjectEnquiriesForOwner,
  getBrokerProjectLinksForOwner,
  getPublishedProjects,
  requireBrokerProfile,
} from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

export default async function BrokerProjectsPage() {
  const profile = await requireBrokerProfile();
  const [allProjectRows, linked, enquiries] = await Promise.all([
    getPublishedProjects(),
    getBrokerProjectLinksForOwner(profile.broker_id),
    getBrokerProjectEnquiriesForOwner(profile.broker_id),
  ]);
  const allProjects = allProjectRows.map((r) => mapProject(r));

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Developer Projects</h1>
        <p className="text-sm text-ink-400">
          Add developer projects to your public profile. Ownership stays with the developer — enquiries from your
          profile come straight to you.
        </p>
      </div>

      <BrokerProjectsManager brokerId={profile.broker_id} allProjects={allProjects} linked={linked} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-100">Recent Enquiries ({enquiries.length})</h2>
        {enquiries.length === 0 ? (
          <p className="text-sm text-ink-500">No enquiries yet from your linked projects.</p>
        ) : (
          <div className="space-y-2">
            {enquiries.map((e) => (
              <div key={e.id} className="rounded-lg border border-navy-700 bg-navy-850 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-100">{e.name}</p>
                  <p className="text-xs text-ink-500">{new Date(e.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-xs text-ink-400">
                  {(e.projects as unknown as { name: string } | null)?.name} · {e.email ?? "—"} · {e.phone ?? "—"}
                </p>
                {e.message && <p className="mt-1 text-xs text-ink-300">{e.message}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
