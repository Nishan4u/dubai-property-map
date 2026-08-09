import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { getPublishedBlogPosts } from "@/lib/supabase/queries";
import { buildOpenGraph } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dubai Real Estate Blog — Market News & Buyer Guides | Dubai Property Map",
  description:
    "Guides and market updates on Dubai off-plan property: payment plans, developer due diligence, Golden Visa eligibility, and where demand is concentrated right now.",
  alternates: { canonical: "/blog" },
  openGraph: buildOpenGraph({
    title: "Dubai Real Estate Blog | Dubai Property Map",
    description: "Guides and market updates for buying property in Dubai.",
    url: "/blog",
  }),
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink-100">Market News &amp; Guides</h1>
        <p className="mt-1 text-sm text-ink-400">
          Investment insights, guides and market updates for Dubai real estate.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="rounded-xl border border-navy-700 bg-navy-850 overflow-hidden transition-colors hover:border-gold-500/40"
            >
              <ProjectThumb
                gradient={post.gradient}
                imageUrl={post.cover_image_url}
                imageAlt={post.title}
                className="h-32 w-full"
              />
              <div className="p-4">
                <h3 className="text-sm font-semibold text-ink-100">{post.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs text-ink-400">{post.excerpt}</p>
                <p className="mt-2 text-xs text-ink-500">
                  {new Date(post.created_at).toLocaleDateString()} · {post.author}
                </p>
              </div>
            </Link>
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-ink-500">No articles published yet.</p>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
