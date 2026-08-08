import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { getBlogPostBySlug } from "@/lib/supabase/queries";

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
  const description = post.excerpt || post.body.slice(0, 160);

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
  const post = await getBlogPostBySlug(slug);
  if (!post || !post.published) notFound();

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
          {post.body}
        </div>
      </div>
    </PublicShell>
  );
}
