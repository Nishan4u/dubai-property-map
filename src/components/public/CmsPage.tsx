import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { createClient } from "@/lib/supabase/server";

// path defaults to "/${slug}", true for every current caller (about,
// advertise, careers, contact, faq, privacy, terms) except the homepage
// itself (slug "homepage_hero", path "/"), which passes its own.
export async function getCmsMetadata(slug: string, path: string = `/${slug}`) {
  const supabase = await createClient();
  const { data: content } = await supabase
    .from("site_content")
    .select("title, body")
    .eq("slug", slug)
    .maybeSingle();

  // No CMS row -- CmsPage() itself notFound()s for this slug, so there's
  // no real page here to claim a canonical URL or OG image for.
  if (!content) return {};

  const title = `${content.title} | Dubai Property Map`;
  const description = content.body.slice(0, 160);

  return {
    title,
    description,
    // alternates.canonical and the full openGraph object (siteName/url/
    // locale/images) are set explicitly here, not left to inherit from
    // the root layout / opengraph-image file convention -- Next.js
    // replaces a route's whole openGraph object rather than deep-merging
    // it once the route supplies its own (even a partial one), so any
    // page returning only { title, description, type } here would
    // silently lose the site-wide siteName/url/locale/image. Confirmed
    // live: /about had no canonical tag and no og:image at all before
    // this fix, despite the site-wide default share image existing.
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website" as const,
      siteName: "Dubai Property Map",
      url: `https://dubaipropertymap.ae${path}`,
      locale: "en_AE",
      images: ["https://dubaipropertymap.ae/opengraph-image"],
    },
  };
}

export async function CmsPage({ slug }: { slug: string }) {
  const supabase = await createClient();
  const { data: content } = await supabase
    .from("site_content")
    .select("title, body")
    .eq("slug", slug)
    .maybeSingle();

  if (!content) notFound();

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold text-ink-100">{content.title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed whitespace-pre-line text-ink-300">
          {content.body}
        </div>
      </div>
    </PublicShell>
  );
}
