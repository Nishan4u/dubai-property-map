import Link from "next/link";
import { Compass } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";

// Next's own bare default 404 has no branding/nav and no path back into
// the site -- a real gap for any stale/typo'd link, a deleted project/
// community/developer/blog post, or a since-removed campaign landing
// page. This intentionally stays a lightweight, static page (no data
// fetching) since it can render for literally any unmatched path.
export const metadata = {
  title: "Page Not Found | Dubai Property Map",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-850 text-gold-400">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm font-semibold tracking-wide text-gold-400">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-100">We couldn&apos;t find that page</h1>
        <p className="mt-3 max-w-md text-sm text-ink-400">
          The link might be outdated, or the listing you&apos;re looking for may have been removed. Try one of
          these instead:
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
          >
            Explore the Map
          </Link>
          <Link
            href="/projects"
            className="rounded-lg border border-navy-700 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            All Projects
          </Link>
          <Link
            href="/communities"
            className="rounded-lg border border-navy-700 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            Communities
          </Link>
          <Link
            href="/developers"
            className="rounded-lg border border-navy-700 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            Developers
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
