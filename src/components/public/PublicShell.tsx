import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { GlobalSearchBox, type SearchItem } from "@/components/public/GlobalSearchBox";
import { PartnerDevelopersSlider, type SliderClickBehavior } from "@/components/public/PartnerDevelopersSlider";
import {
  getCommunities,
  getCurrentProfile,
  getDevelopers,
  getMapAccessStatus,
  getNavLinks,
  getPublishedProjects,
  getViewerProjectScope,
} from "@/lib/supabase/queries";
import { mapDeveloper } from "@/lib/supabase/mappers";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  // Keeps the header search consistent with the main map: a logged-in
  // Developer/Salesperson only finds their own developer's projects here too.
  const viewerDeveloperId = await getViewerProjectScope();
  const { status: mapAccessStatus } = await getMapAccessStatus();
  const viewerProfile = await getCurrentProfile();
  // Spec: guests get redirected to login on click; Developer/Salesperson
  // see the slider but it's fully inert; everyone else (buyer, broker,
  // broker agency, admin) gets the real developer-page link.
  const sliderClickBehavior: SliderClickBehavior = !viewerProfile
    ? "guest"
    : viewerProfile.role === "developer" || viewerProfile.role === "salesperson"
      ? "disabled"
      : "link";

  const [headerLinks, footerLinks, projects, communities, developers] = await Promise.all([
    getNavLinks("header"),
    getNavLinks("footer"),
    // Same protection as the map itself (spec section 20): a guest or
    // unsubscribed broker/salesperson/agency never gets real project names
    // in the search payload, not even to leak via the search dropdown.
    mapAccessStatus === "ok" ? getPublishedProjects(viewerDeveloperId ?? undefined) : Promise.resolve([]),
    getCommunities(),
    getDevelopers(),
  ]);

  const searchItems: SearchItem[] = [
    ...projects.map((p) => ({
      type: "project" as const,
      id: p.id,
      name: p.name,
      href: `/projects/${p.slug}`,
      subtitle: p.communities?.name ?? p.developers?.name ?? undefined,
    })),
    ...communities.map((c) => ({
      type: "community" as const,
      id: c.id,
      name: c.name,
      href: `/communities/${c.slug}`,
    })),
    // The Developers directory itself is hidden from Developer/Salesperson
    // accounts (they only ever manage their own), so it shouldn't surface
    // as a search shortcut for them either.
    ...(viewerDeveloperId
      ? []
      : developers.map((d) => ({
          type: "developer" as const,
          id: d.id,
          name: d.name,
          href: `/developers/${d.slug}`,
        }))),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <div className="border-b border-navy-700 bg-navy-900">
        <header className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo/dubai-property-map-logo.png"
              alt="Dubai Property Map"
              width={883}
              height={237}
              priority
              className="h-8 w-auto sm:h-9"
            />
          </Link>

          <GlobalSearchBox items={searchItems} />

          <Link
            href="/favorites"
            className="hidden shrink-0 items-center justify-center rounded-lg border border-navy-700 p-2 text-ink-300 hover:text-ink-100 sm:flex"
          >
            <Heart className="h-4 w-4" />
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <AuthStatus />
          </div>
        </header>
        <nav className="flex items-center gap-5 overflow-x-auto border-t border-navy-800/80 px-6 py-2 text-xs font-medium text-ink-400">
          {headerLinks
            .filter((link) => !viewerDeveloperId || link.url !== "/developers")
            .map((link) => (
              <Link key={link.id} href={link.url} className="shrink-0 hover:text-ink-100">
                {link.label}
              </Link>
            ))}
        </nav>
      </div>
      <PartnerDevelopersSlider developers={developers.map((d) => mapDeveloper(d))} clickBehavior={sliderClickBehavior} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-navy-800 px-6 py-6 text-center text-xs text-ink-500">
        <div className="mb-2 flex flex-wrap justify-center gap-4">
          {footerLinks
            .filter((link) => !viewerDeveloperId || link.url !== "/developers")
            .map((link) => (
              <Link key={link.id} href={link.url} className="hover:text-ink-300">
                {link.label}
              </Link>
            ))}
        </div>
        © 2026 Dubai Property Map. All rights reserved.
      </footer>
    </div>
  );
}
