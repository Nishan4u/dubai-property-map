import { notFound } from "next/navigation";
import Link from "next/link";
import { EmbedDeveloperMap } from "@/components/embed/EmbedDeveloperMap";
import {
  getDeveloperBySlug,
  getProjectPreviewsForDeveloper,
  incrementDeveloperEmbedViews,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

// Deliberately outside <PublicShell> and never gated by getMapAccessStatus()
// -- this route exists specifically so a developer can embed it via
// <iframe> on their OWN external website, for ANY visitor there (no
// header/nav/footer chrome, no site-wide subscription gate; the data it
// shows is the same public-safe project preview set already shown on the
// developer's own dubaipropertymap.ae profile page). Not indexed -- this
// is a widget surface, not a page meant to rank on its own.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) return {};

  return {
    title: `${developer.name} — Properties Map`,
    robots: { index: false, follow: false },
  };
}

export default async function DeveloperEmbedMapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) notFound();

  const projects = await getProjectPreviewsForDeveloper(developer.id);
  await incrementDeveloperEmbedViews(developer.id);

  return (
    <div className="flex h-screen w-screen flex-col bg-navy-900">
      <div className="min-h-0 flex-1">
        <EmbedDeveloperMap projects={projects} />
      </div>
      <Link
        href={`https://dubaipropertymap.ae/developers/${developer.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center justify-center gap-1.5 border-t border-navy-800 bg-navy-950 py-1.5 text-[11px] font-medium text-ink-500 hover:text-gold-400"
      >
        {developer.name} on{" "}
        <span className="font-semibold text-gold-400">Dubai Property Map</span>
      </Link>
    </div>
  );
}
