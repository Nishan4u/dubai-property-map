import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { AdPlacementActions } from "@/components/admin/AdPlacementActions";
import { getAllAdPlacementsAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const statusTone = {
  pending: "gold",
  active: "green",
  rejected: "red",
  expired: "neutral",
} as const;

const placementLabel: Record<string, string> = {
  homepage_banner: "Homepage Banner",
  sidebar_banner: "Sidebar Banner",
  sponsored_pin: "Sponsored Map Pin",
  community_banner: "Community Banner",
  project_page_banner: "Project Page Banner",
  developer_page_banner: "Developer Page Banner",
};

export default async function AdminAdsPage() {
  const placements = await getAllAdPlacementsAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Advertisements</h1>
        <p className="text-sm text-ink-400">
          Homepage banners and sponsored placements purchased by developers.
          Google AdSense/Ad Manager needs a separate Google account and an
          approved live site to activate — the Publisher ID/Network Code
          fields are on the Settings page, ready whenever you have one.
        </p>
      </div>

      <DataTable
        columns={[
          { header: "Title", render: (a) => <span className="font-medium text-ink-100">{a.title}</span> },
          { header: "Developer", render: (a) => a.developers?.name ?? "—" },
          { header: "Type", render: (a) => placementLabel[a.placement_type] ?? a.placement_type },
          {
            header: "Target",
            render: (a) => a.projects?.name ?? a.communities?.name ?? "—",
          },
          { header: "Dates", render: (a) => `${a.starts_at ?? "—"} → ${a.ends_at ?? "—"}` },
          {
            header: "Status",
            render: (a) => <Badge tone={statusTone[a.status as keyof typeof statusTone]}>{a.status}</Badge>,
          },
          {
            header: "",
            render: (a) => (
              <AdPlacementActions id={a.id} title={a.title} developerId={a.developer_id} />
            ),
          },
        ]}
        rows={placements}
      />
      {placements.length === 0 && (
        <p className="text-sm text-ink-500">No ad requests yet.</p>
      )}
    </div>
  );
}
