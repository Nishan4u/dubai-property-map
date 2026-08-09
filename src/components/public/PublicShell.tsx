import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { LanguageCurrencySwitcher } from "@/components/i18n/LanguageCurrencySwitcher";
import { t } from "@/lib/i18n/locale";
import { GlobalSearchBox, type SearchItem } from "@/components/public/GlobalSearchBox";
import { MobileNavMenu } from "@/components/public/MobileNavMenu";
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

  const visibleHeaderLinks = headerLinks.filter(
    (link) => !viewerDeveloperId || link.url !== "/developers"
  );

  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <div className="relative border-b border-navy-700 bg-navy-900">
        <header className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-6">
          {/* Pairs logo with auth/admin buttons on mobile so they don't
             wrap onto their own orphaned row with a big empty gap next to
             them -- "sm:contents" undoes this at sm: and up, rejoining
             them as ordinary flex-wrap children like before. */}
          <div className="flex w-full items-center justify-between gap-2 sm:contents">
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
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <MobileNavMenu links={visibleHeaderLinks} />
              <AuthStatus />
            </div>
          </div>

          {/* Search + switcher share one row on mobile instead of each
             getting its own -- "sm:contents" on both wrappers makes them
             vanish at sm: and up, so GlobalSearchBox rejoins the header's
             flex-wrap exactly as before (its own full-width row) and the
             switcher only ever shows via its other instance further down. */}
          <div className="flex items-center gap-2 sm:contents">
            <div className="min-w-0 flex-1 sm:contents">
              <GlobalSearchBox items={searchItems} />
            </div>
            <div className="shrink-0 sm:hidden">
              <LanguageCurrencySwitcher />
            </div>
          </div>

          {/* Favorites + auth are one non-splitting cluster -- at widths
             where the row wraps, flex-wrap can otherwise land them on the
             same wrapped line as separate items with unclaimed space
             between them, leaving a stray gap before Admin Panel/Logout.
             Grouped together they always sit flush, wherever the whole
             cluster ends up. */}
          <div className="ms-auto hidden shrink-0 items-center gap-2 sm:flex">
            <LanguageCurrencySwitcher />
            <Link
              href="/favorites"
              prefetch={false}
              className="flex shrink-0 items-center justify-center rounded-lg border border-navy-700 p-2 text-ink-300 hover:text-ink-100"
            >
              <Heart className="h-4 w-4" />
            </Link>
            <AuthStatus />
          </div>
        </header>
        {/* prefetch={false} throughout this shell -- it's mounted on
           every non-homepage public page, and every link here is always
           visible above the fold, so Next's default viewport-triggered
           prefetching was firing a full server-rendered page fetch for
           every nav item, footer link, and (via PartnerDevelopersSlider
           below) every visible developer icon on every single page
           load -- confirmed live via the network panel. Real navigation
           still works exactly the same, just without the eager
           background fetch. */}
        <nav className="hidden items-center gap-5 overflow-x-auto border-t border-navy-800/80 px-6 py-2 text-xs font-medium text-ink-400 sm:flex">
          {visibleHeaderLinks.map((link) => (
            <Link key={link.id} href={link.url} prefetch={false} className="shrink-0 hover:text-ink-100">
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
              <Link key={link.id} href={link.url} prefetch={false} className="hover:text-ink-300">
                {link.label}
              </Link>
            ))}
        </div>
        {await t("footer.rights", { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
}
