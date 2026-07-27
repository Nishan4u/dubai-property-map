import { DataTable } from "@/components/ui/DataTable";
import { getStaffSharedLinks } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function StaffSharedLinksPage() {
  const links = await getStaffSharedLinks();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Shared Links</h1>
        <p className="text-sm text-ink-400">
          Links you&apos;ve generated via the Share button on project and developer pages. Clicking a link alone
          never generates commission — only an actual paid subscription does.
        </p>
      </div>

      <DataTable
        columns={[
          { header: "Target", render: (l) => l.targetName },
          { header: "Type", render: (l) => <span className="capitalize">{l.target_type}</span> },
          { header: "Link", render: (l) => <span className="font-mono text-xs text-gold-400">/s/{l.share_code}</span> },
          { header: "Clicks", render: (l) => l.clickCount },
          { header: "Created", render: (l) => new Date(l.created_at).toLocaleDateString() },
        ]}
        rows={links}
      />
      {links.length === 0 && (
        <p className="text-xs text-ink-500">
          No shared links yet — use the Share button on any project or developer page to create one.
        </p>
      )}
    </div>
  );
}
