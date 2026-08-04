import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { getLandingPageBySlug } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLandingPageBySlug(slug);
  if (!page) return {};

  return {
    title: `${page.title} | Dubai Property Map`,
    description: page.body.slice(0, 160),
    openGraph: { title: page.title, description: page.body.slice(0, 160), type: "website" },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLandingPageBySlug(slug);
  if (!page) notFound();

  const paragraphs = page.body.split(/\n\s*\n/).filter((p: string) => p.trim());

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {page.hero_image_url && (
          <div className="mb-6 aspect-[16/7] w-full overflow-hidden rounded-xl bg-navy-800">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered arbitrary URL, same as every other user-supplied image in this codebase (no remotePatterns configured for next/image) */}
            <img src={page.hero_image_url} alt={page.title} className="h-full w-full object-cover" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-ink-100 sm:text-3xl">{page.title}</h1>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-300">
          {paragraphs.map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {page.cta_text && page.cta_url && (
          <a
            href={page.cta_url}
            className="mt-8 inline-flex items-center rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-950 hover:bg-gold-400"
          >
            {page.cta_text}
          </a>
        )}
      </div>
    </PublicShell>
  );
}
