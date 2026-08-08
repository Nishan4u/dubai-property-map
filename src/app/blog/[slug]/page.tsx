import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { AdUnit } from "@/components/ads/AdUnit";
import { AD_SLOTS } from "@/lib/adSlots";
import { isAdsEnabled } from "@/lib/adsEnabled";
import { getActiveBlogInArticleBanner, getBlogPostBySlug } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || !post.published) return {};

  const title = `${post.title} | Dubai Property Map Blog`;
  // Same literal-"\n" normalization as the page body below -- otherwise a
  // post without its own excerpt would show garbled "\n" characters in
  // search-result snippets and social-share previews.
  const description = post.excerpt || post.body.replace(/\\n/g, " ").slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title, description, type: "article", url: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, adsEnabled, inArticleBanner] = await Promise.all([
    getBlogPostBySlug(slug),
    isAdsEnabled(),
    getActiveBlogInArticleBanner(),
  ]);
  if (!post || !post.published) notFound();

  // Every existing blog post was seeded with literal "\n" (backslash + n)
  // in its body instead of real line breaks -- confirmed across all 3 live
  // posts -- so whitespace-pre-line below has never actually produced
  // paragraph spacing, it's just been rendering the literal characters.
  // Normalizing first fixes that display bug for free and means the split
  // below works on both real newlines and this literal form.
  const normalizedBody = post.body.replace(/\\n/g, "\n");

  // Splits on blank-line paragraph breaks so the in-article ad can sit
  // roughly mid-post rather than at the very top or bottom -- falls back
  // to no ad (never a broken layout) when a post is too short to split.
  const paragraphs = normalizedBody.split(/\n\s*\n/);
  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = paragraphs.slice(midpoint).join("\n\n");

  return (
    <PublicShell>
      <ProjectThumb
        gradient={post.gradient}
        imageUrl={post.cover_image_url}
        className="h-56 w-full sm:h-64"
      />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink-100">{post.title}</h1>
        <p className="mt-1 text-xs text-ink-500">
          {new Date(post.created_at).toLocaleDateString()} · {post.author}
        </p>
        <div className="mt-6 space-y-4 whitespace-pre-line text-sm leading-relaxed text-ink-300">
          {firstHalf}
        </div>
        {secondHalf && (
          <>
            {inArticleBanner && (
              <Link
                href={inArticleBanner.target_url ? `/api/ads/click/${inArticleBanner.id}` : "#"}
                className="my-6 block overflow-hidden rounded-xl border border-gold-500/30 bg-gold-500/10 hover:border-gold-500/50"
              >
                {inArticleBanner.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inArticleBanner.image_url}
                    alt={inArticleBanner.title}
                    className="h-24 w-full object-cover sm:h-28"
                  />
                ) : (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-gold-400">Sponsored</p>
                    <p className="mt-1 text-sm font-medium text-ink-100">{inArticleBanner.title}</p>
                    {inArticleBanner.developers?.name && (
                      <p className="mt-0.5 text-xs text-ink-500">by {inArticleBanner.developers.name}</p>
                    )}
                  </div>
                )}
              </Link>
            )}
            {adsEnabled && (
              <AdUnit slot={AD_SLOTS.blogPostInArticle} format="fluid" layout="in-article" className="my-6" />
            )}
            <div className="space-y-4 whitespace-pre-line text-sm leading-relaxed text-ink-300">
              {secondHalf}
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}
