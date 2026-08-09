// Every public page that defines its own `openGraph` object has to
// re-declare siteName/locale/images itself -- Next.js replaces a route's
// whole openGraph object rather than deep-merging it against the root
// layout's defaults (src/app/layout.tsx), and (separately, confirmed live)
// the opengraph-image file-convention image doesn't reliably cascade into
// a route that supplies any openGraph fields of its own, even partial
// ones. Repeating that boilerplate at every generateMetadata/metadata call
// site is exactly how og:site_name/og:url/og:locale/og:image ended up
// silently missing across most of the site (fixed one-by-one for the
// CMS-driven pages in getCmsMetadata; this is the equivalent for every
// other page with dynamic, per-entity metadata). One source of truth here
// instead.
export const SITE_URL = "https://dubaipropertymap.ae";
export const SITE_NAME = "Dubai Property Map";
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;

export function buildOpenGraph({
  title,
  description,
  url,
  type = "website",
  images,
}: {
  title: string;
  description: string;
  /** Root-relative ("/blog/foo") or already-absolute (subdomain storefronts) URL for this exact page. */
  url: string;
  type?: "website" | "article" | "profile";
  /** Falls back to the site-wide default share card when omitted or empty -- never unset. */
  images?: (string | null | undefined)[];
}) {
  const realImages = (images ?? []).filter((i): i is string => Boolean(i));
  return {
    title,
    description,
    type,
    siteName: SITE_NAME,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    locale: "en_AE",
    images: realImages.length > 0 ? realImages : [DEFAULT_OG_IMAGE],
  };
}
