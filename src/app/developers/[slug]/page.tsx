import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Award, BadgeCheck } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectCard } from "@/components/public/ProjectCard";
import { DeveloperPublicSummary } from "@/components/public/DeveloperPublicSummary";
import { DeveloperReviews } from "@/components/public/DeveloperReviews";
import { DeveloperContactForm } from "@/components/public/DeveloperContactForm";
import { ShareButton } from "@/components/public/ShareButton";
import {
  getActiveDeveloperBanner,
  getDeveloperAwards,
  getDeveloperBySlug,
  getDeveloperReviews,
  getMapAccessStatus,
  getProjectsForDeveloper,
  getViewerProjectScope,
} from "@/lib/supabase/queries";
import { mapProject, currentYear } from "@/lib/supabase/mappers";
import { getLocale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) return {};

  const title = `${developer.name} | Dubai Property Map`;
  const description =
    developer.description ||
    `Explore projects by ${developer.name}, a real estate developer in Dubai.`;

  return {
    title,
    description,
    alternates: { canonical: `/developers/${developer.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/developers/${developer.slug}`,
      ...(developer.logo_url ? { images: [developer.logo_url] } : {}),
    },
  };
}

export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const viewerDeveloperId = await getViewerProjectScope();
  if (viewerDeveloperId) {
    redirect("/");
  }

  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) notFound();

  const locale = await getLocale();
  const developerName = locale === "ar" && developer.name_ar ? developer.name_ar : developer.name;
  const developerDescription = locale === "ar" && developer.description_ar ? developer.description_ar : developer.description;

  // Guests/unsubscribed viewers see a real, public-safe summary (name,
  // logo, description) -- the `developers` table is already publicly
  // readable at the RLS level for active developers, so this is purely
  // an app-layer choice of what to render. The project list, awards,
  // reviews and contact form stay behind the register/subscribe gate
  // rendered inside DeveloperPublicSummary.
  const { status: mapAccessStatus, subscriptionHref } = await getMapAccessStatus();
  if (mapAccessStatus !== "ok") {
    return (
      <PublicShell>
        <DeveloperPublicSummary
          developer={developer}
          developerName={developerName}
          developerDescription={developerDescription}
          status={mapAccessStatus}
          subscriptionHref={subscriptionHref}
        />
      </PublicShell>
    );
  }

  const [devProjectRows, awards, reviews, developerBanner] = await Promise.all([
    getProjectsForDeveloper(developer.id),
    getDeveloperAwards(developer.id),
    getDeveloperReviews(developer.id),
    getActiveDeveloperBanner(developer.id),
  ]);
  const devProjects = devProjectRows
    .filter((p) => p.status === "published" || p.status === "featured")
    .map((p) => mapProject(p));

  const completedCount = devProjectRows.filter(
    (p) => (p.handover_year ?? currentYear()) < currentYear()
  ).length;
  const underConstructionCount = devProjectRows.length - completedCount;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: developerName,
    description: developerDescription || undefined,
    url: `https://dubaipropertymap.ae/developers/${developer.slug}`,
    ...(developer.logo_url ? { logo: developer.logo_url } : {}),
  };

  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-10">
        {developerBanner && (
          <Link
            href={developerBanner.target_url ? `/api/ads/click/${developerBanner.id}` : "#"}
            className="mb-4 block overflow-hidden rounded-xl border border-gold-500/30 bg-gold-500/10 hover:border-gold-500/50"
          >
            {developerBanner.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={developerBanner.image_url} alt={developerBanner.title} className="w-full object-cover" />
            ) : (
              <div className="p-4">
                <p className="text-xs font-semibold text-gold-400">Sponsored</p>
                <p className="mt-1 text-sm font-medium text-ink-100">{developerBanner.title}</p>
              </div>
            )}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
          {developer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={developer.logo_url}
              alt={developer.name}
              className="h-16 w-16 shrink-0 rounded-2xl border border-navy-700 bg-navy-900 object-contain p-2"
            />
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
              style={{ background: developer.color }}
            >
              {developer.initial}
            </div>
          )}
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
              {developerName}
              {developer.verified && (
                <BadgeCheck className="h-5 w-5 text-sky-400" />
              )}
            </h1>
            {developer.founded && (
              <p className="mt-1 text-sm text-ink-400">
                Since {developer.founded}
              </p>
            )}
          </div>
          <div className="flex gap-6 text-center">
            <Stat label="Projects" value={devProjectRows.length} />
            <Stat label="Completed" value={completedCount} />
            <Stat label="Under Construction" value={underConstructionCount} />
          </div>
          <ShareButton targetType="developer" targetId={developer.id} title={developer.name} />
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-300">
          {developerDescription}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-ink-100">
                Projects by {developer.name}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {devProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
                {devProjects.length === 0 && (
                  <p className="text-sm text-ink-500">
                    No active projects listed.
                  </p>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink-100">
                <Award className="h-5 w-5 text-gold-400" /> Awards
              </h2>
              {awards.length === 0 ? (
                <p className="text-sm text-ink-500">
                  No awards listed for {developer.name} yet.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {awards.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-lg border border-navy-700 bg-navy-850 px-4 py-3 text-sm"
                    >
                      <p className="font-medium text-ink-100">{a.title}</p>
                      <p className="text-xs text-ink-500">
                        {[a.issuer, a.year].filter(Boolean).join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-ink-100">Reviews</h2>
              <DeveloperReviews developerId={developer.id} initialReviews={reviews} />
            </section>
          </div>

          <div>
            <DeveloperContactForm developerId={developer.id} />
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-bold text-ink-100">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
