import { AdminLandingPagesManager } from "@/components/admin/AdminLandingPagesManager";
import { getAllLandingPagesAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminLandingPagesPage() {
  const pages = await getAllLandingPagesAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Landing Pages</h1>
        <p className="text-sm text-ink-400">
          Standalone public pages for marketing campaigns and offline collateral — each lives at /l/&lt;slug&gt;
          once published.
        </p>
      </div>

      <AdminLandingPagesManager pages={pages} />
    </div>
  );
}
