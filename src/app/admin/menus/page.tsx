import { NavLinksManager } from "@/components/admin/NavLinksManager";
import { getNavLinks } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminMenusPage() {
  const [headerLinks, footerLinks] = await Promise.all([
    getNavLinks("header"),
    getNavLinks("footer"),
  ]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Menus</h1>
        <p className="text-sm text-ink-400">
          Manage the header and footer navigation links shown across the
          public site.
        </p>
      </div>
      <NavLinksManager headerLinks={headerLinks} footerLinks={footerLinks} />
    </div>
  );
}
