import Link from "next/link";
import { RedirectsManager } from "@/components/admin/RedirectsManager";
import { getRedirects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const redirects = await getRedirects();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">SEO</h1>
        <p className="text-sm text-ink-400">
          Site-wide SEO is generated automatically from real data — project,
          community, developer and blog pages each carry their own meta
          title/description and Open Graph tags, plus real structured data
          (JSON-LD) on project pages.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-sm">
          <p className="font-medium text-ink-100">Sitemap</p>
          <p className="mt-1 text-ink-400">
            Generated live from every published project, community, developer
            and blog post.
          </p>
          <Link
            href="/sitemap.xml"
            target="_blank"
            className="mt-2 inline-block text-xs text-gold-400 hover:underline"
          >
            View /sitemap.xml →
          </Link>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4 text-sm">
          <p className="font-medium text-ink-100">Robots</p>
          <p className="mt-1 text-ink-400">
            Allows crawling of public pages, blocks /dashboard, /admin, and
            /account.
          </p>
          <Link
            href="/robots.txt"
            target="_blank"
            className="mt-2 inline-block text-xs text-gold-400 hover:underline"
          >
            View /robots.txt →
          </Link>
        </div>
      </div>

      <RedirectsManager redirects={redirects} />

      <p className="text-xs text-ink-500">
        Per-page meta titles/descriptions come from each project&apos;s
        name/description, each community&apos;s Meta Title/Description
        (set on the Communities page), and the CMS pages&apos; titles/bodies.
      </p>
    </div>
  );
}
