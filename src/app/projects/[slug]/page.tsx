import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Building2, Download, FileText, MapPin, Play, Star } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProjectCalculatorsPanel } from "@/components/public/ProjectCalculatorsPanel";
import { ProjectCard } from "@/components/public/ProjectCard";
import { ProjectPublicSummary } from "@/components/public/ProjectPublicSummary";
import { ProjectEnquiryPanel } from "@/components/public/ProjectEnquiryPanel";
import { ShareButton } from "@/components/public/ShareButton";
import { RequestPropertyPanel } from "@/components/broker/RequestPropertyPanel";
import { AgencyRequestPropertyPanel } from "@/components/broker-agency/AgencyRequestPropertyPanel";
import { GalleryLightbox } from "@/components/public/GalleryLightbox";
import { NearbyDistances } from "@/components/public/NearbyDistances";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { Badge } from "@/components/ui/Badge";
import { AdUnit } from "@/components/ads/AdUnit";
import { AD_SLOTS } from "@/lib/adSlots";
import { isAdsEnabled } from "@/lib/adsEnabled";
import { getCurrency, formatPrice } from "@/lib/i18n/locale";
import { findNearestByCategory } from "@/lib/investmentScore";
import {
  getActiveProjectBanner,
  getConstructionMilestones,
  getMapAccessStatus,
  getProjectBySlug,
  getProjectDocumentsByCategory,
  getProjectGallerySections,
  getProjectMediaFiles,
  getProjectPreviewBySlug,
  getProjectsForCommunity,
  getProjectUnitAvailability,
  getProjectUnitTypes,
  getUnitTypeFloorPlans,
  getViewerProjectScope,
  incrementProjectViews,
} from "@/lib/supabase/queries";
import { mapProject } from "@/lib/supabase/mappers";
import { getLocationEmbedUrl, getVideoEmbedUrl } from "@/lib/mediaEmbed";
import { getProjectStatusLabel } from "@/lib/projectStatus";
import { documentCategories } from "@/lib/documentCategories";
import { getMapboxStaticImageUrl } from "@/lib/mapboxStaticImage";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Public-safe preview, not the full row -- generateMetadata runs for
  // EVERY viewer including guests and crawlers (link unfurling needs a
  // title/image/price even when the real detail page is gated), so this
  // must never touch the RLS-protected full project fetch.
  const project = await getProjectPreviewBySlug(slug);
  if (!project) return {};

  const title = `${project.name} by ${project.developer_name} | Dubai Property Map`;
  const description =
    project.description ||
    `${project.property_type} in ${project.community_name}, starting from AED ${project.price_from_aed.toLocaleString()}.`;

  // Rich share-card image (spec: Share Feature) -- the project's own cover
  // photo first (what most platforms show), the Mapbox static map card as a
  // fallback/secondary image when there's no cover photo but coordinates exist.
  const mapImage = project.lat != null && project.lng != null ? getMapboxStaticImageUrl(project.lat, project.lng) : null;
  const images = [project.cover_image_url, mapImage].filter((url): url is string => Boolean(url));

  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/projects/${project.slug}`,
      ...(images.length ? { images } : {}),
    },
  };
}

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currency = await getCurrency();
  // Existence + ownership checks use the public-safe preview, not the full
  // RLS-protected row -- since patch_83 locks the base `projects` table
  // down to authorized viewers only, fetching the full row for a guest
  // would return null indistinguishably from "doesn't exist", which would
  // incorrectly 404 instead of showing the gate below.
  const preview = await getProjectPreviewBySlug(slug);
  if (!preview) notFound();

  // A Developer/Salesperson account is scoped to their own developer
  // everywhere else on the platform (homepage, All Projects, search) --
  // the same restriction applies to a direct project URL too (spec
  // sections 17/20/22: "must NOT see projects belonging to" other
  // developers, "even through ... Direct URL"). Returning notFound()
  // rather than a permission message matches "must not see" -- it doesn't
  // even confirm the project exists.
  const viewerDeveloperId = await getViewerProjectScope();
  if (viewerDeveloperId && preview.developer_id !== viewerDeveloperId) notFound();

  // Guests and unsubscribed brokers/salespersons/agencies see a real,
  // public-safe summary (name, developer, community, starting price,
  // description) sourced only from `projects_public_meta` -- the same
  // curated view already used for generateMetadata above, which never
  // contains payment plan, unit types, amenities, gallery, documents or
  // contact info. Those deeper fields stay behind the register/subscribe
  // gate rendered inside ProjectPublicSummary.
  const { status: mapAccessStatus, subscriptionHref } = await getMapAccessStatus();
  if (mapAccessStatus !== "ok") {
    return (
      <PublicShell>
        <ProjectPublicSummary
          preview={preview}
          currency={currency}
          status={mapAccessStatus}
          subscriptionHref={subscriptionHref}
        />
      </PublicShell>
    );
  }

  // Only reached once authorized -- the full row, now genuinely
  // RLS-protected by patch_83, not just withheld by app-layer choice.
  const row = await getProjectBySlug(slug);
  if (!row) notFound();

  const project = mapProject(row);
  const developer = row.developers;
  const community = row.communities;
  await incrementProjectViews(project.id);
  const similarRows = await getProjectsForCommunity(row.community_id);
  const similar = similarRows
    .filter((p) => p.id !== project.id)
    .slice(0, 3)
    .map((p) => mapProject(p));

  const [gallery, gallerySections, documents, milestones, projectBanner, unitTypes, unitAvailability, adsEnabled] = await Promise.all([
    getProjectMediaFiles(project.id, "gallery"),
    getProjectGallerySections(project.id),
    getProjectDocumentsByCategory(project.id),
    getConstructionMilestones(project.id),
    getActiveProjectBanner(project.id),
    getProjectUnitTypes(project.id),
    getProjectUnitAvailability(project.id),
    isAdsEnabled(),
  ]);
  const unitTypeFloorPlans: Record<string, Awaited<ReturnType<typeof getUnitTypeFloorPlans>>> =
    Object.fromEntries(
      await Promise.all(
        unitTypes.map(async (u) => [u.id, await getUnitTypeFloorPlans(project.id, u.id)] as const)
      )
    );
  const images = gallery.filter((f) => f.isImage);
  const exteriorImages = gallerySections.exterior.flatMap((s) => s.files);
  const interiorImages = gallerySections.interior.flatMap((s) => s.files);
  const brochureDoc =
    documents.find((d) => d.category === "Brochure") ?? documents[0] ?? null;
  const videoEmbedUrl = project.videoUrl ? getVideoEmbedUrl(project.videoUrl) : null;
  const locationEmbedUrl = getLocationEmbedUrl({
    lat: project.lat,
    lng: project.lng,
    fallbackQuery: `${community?.name ?? ""}, Dubai`,
  });
  const nearbyPoi =
    project.lat != null && project.lng != null
      ? findNearestByCategory(project.lat, project.lng, [
          "metro",
          "malls",
          "schools",
          "hospitals",
          "airports",
          "beaches",
        ])
      : [];

  // "RealEstateListing" isn't a real schema.org type -- Google's structured
  // data validator either ignores or flags it, so it was never producing
  // any actual search benefit. "Product" is the type Google's own guidance
  // recommends for a priced listing like this (real estate included), and
  // is what's actually recognized/parsed by Search Console + rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.name,
    description: project.description || undefined,
    image: project.coverImageUrl || undefined,
    brand: project.developerName ? { "@type": "Brand", name: project.developerName } : undefined,
    url: `https://dubaipropertymap.ae/projects/${project.slug}`,
    offers: {
      "@type": "Offer",
      price: project.priceFromAed,
      priceCurrency: "AED",
      availability: "https://schema.org/InStock",
      url: `https://dubaipropertymap.ae/projects/${project.slug}`,
    },
  };

  // BreadcrumbList is one of the few real-estate-relevant rich results
  // Google actually renders in the SERP (the "Home > All Projects >
  // Community > Project" trail instead of the raw URL) -- genuinely worth
  // adding, unlike the non-standard type above.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dubaipropertymap.ae/" },
      { "@type": "ListItem", position: 2, name: "All Projects", item: "https://dubaipropertymap.ae/projects" },
      ...(community
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: community.name,
              item: `https://dubaipropertymap.ae/communities/${community.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: community ? 4 : 3,
        name: project.name,
        item: `https://dubaipropertymap.ae/projects/${project.slug}`,
      },
    ],
  };

  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProjectThumb
        gradient={project.gradient}
        imageUrl={project.coverImageUrl}
        imageAlt={`${project.name} by ${project.developerName} in ${project.communityName}, Dubai`}
        logoUrl={project.logoUrl}
        logoAlt={`${project.developerName} logo`}
        logoSize="lg"
        className="h-64 w-full sm:h-72"
      />

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-6">
        {projectBanner && (
          <Link
            href={projectBanner.target_url ? `/api/ads/click/${projectBanner.id}` : "#"}
            className="mb-4 block overflow-hidden rounded-xl border border-gold-500/30 bg-gold-500/10 hover:border-gold-500/50"
          >
            {projectBanner.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={projectBanner.image_url} alt={projectBanner.title} className="w-full object-cover" />
            ) : (
              <div className="p-4">
                <p className="text-xs font-semibold text-gold-400">Sponsored</p>
                <p className="mt-1 text-sm font-medium text-ink-100">{projectBanner.title}</p>
                {projectBanner.developers?.name && (
                  <p className="mt-0.5 text-xs text-ink-500">by {projectBanner.developers.name}</p>
                )}
              </div>
            )}
          </Link>
        )}
        <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {project.featured && <Badge tone="gold">Featured</Badge>}
                {project.tags.map((t) => (
                  <Badge key={t} tone="blue">
                    {t.replace("-", " ")}
                  </Badge>
                ))}
              </div>
              <h1 className="mt-2 text-2xl font-bold text-ink-100">
                {project.name}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-ink-400">
                <MapPin className="h-4 w-4" /> {community?.name} · by{" "}
                <Link
                  href={`/developers/${developer?.slug}`}
                  className="text-gold-400 hover:underline"
                >
                  {developer?.name}
                </Link>
              </p>
            </div>
            <div className="text-right">
              <div className="flex justify-end">
                <ShareButton
                  targetType="project"
                  targetId={project.id}
                  title={project.name}
                />
              </div>
              <p className="mt-2 text-xs text-ink-500">Starting From</p>
              <p className="text-2xl font-bold text-gold-400">
                {formatPrice(project.priceFromAed, currency)}
              </p>
              <p className="flex items-center justify-end gap-1 text-xs text-ink-400">
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                {project.rating || "New"} ({project.reviews} reviews)
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-navy-800 pt-5 sm:grid-cols-4">
            <Fact label="Property Type" value={project.propertyType} />
            <Fact
              label="Bedrooms"
              value={
                project.bedroomsFrom === project.bedroomsTo
                  ? `${project.bedroomsFrom} BR`
                  : `${project.bedroomsFrom} - ${project.bedroomsTo} BR`
              }
            />
            <Fact label="Payment Plan" value={project.paymentPlan} />
            <Fact
              label="Handover"
              value={`${project.handoverQuarter} ${project.handoverYear}`}
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Section title="Overview">
              <p className="text-sm leading-relaxed text-ink-300">
                {project.description}
              </p>
            </Section>

            {(project.paymentPlanDetails ?? []).length > 0 && (
              <Section title="Payment Plan">
                <div className="overflow-hidden rounded-lg border border-navy-700">
                  {(project.paymentPlanDetails ?? []).map((stage, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-navy-800 bg-navy-850 px-4 py-3 text-sm last:border-b-0"
                    >
                      <span className="text-ink-300">{stage.label}</span>
                      <span className="font-semibold text-gold-400">{stage.percent}%</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {unitTypes.length > 0 && (
              <Section title="Unit Types">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {unitTypes.map((u) => (
                    <div
                      key={u.id}
                      className="overflow-hidden rounded-lg border border-navy-700 bg-navy-850"
                    >
                      {u.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image_url}
                          alt={u.unit_name}
                          className="h-32 w-full object-cover"
                        />
                      )}
                      <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-ink-100">{u.unit_name}</p>
                          <p className="text-xs text-ink-500">{u.unit_type}</p>
                        </div>
                        <Badge
                          tone={
                            u.availability === "available"
                              ? "green"
                              : u.availability === "limited"
                                ? "gold"
                                : "red"
                          }
                        >
                          {u.availability === "sold_out"
                            ? "Sold Out"
                            : u.availability === "limited"
                              ? "Limited"
                              : "Available"}
                        </Badge>
                      </div>
                      {u.starting_price_aed != null && (
                        <p className="mt-2 text-sm font-semibold text-gold-400">
                          From {formatPrice(u.starting_price_aed, currency)}
                        </p>
                      )}
                      {unitAvailability[u.id] && (
                        <p className="mt-1 text-xs text-ink-500">
                          {unitAvailability[u.id].available} of {unitAvailability[u.id].total} units available
                        </p>
                      )}
                      <p className="mt-1 text-xs text-ink-400">
                        {[
                          u.size_sqft != null ? `${u.size_sqft.toLocaleString()} sq ft` : null,
                          u.bedrooms != null ? `${u.bedrooms} Bed` : null,
                          u.bathrooms != null ? `${u.bathrooms} Bath` : null,
                          u.has_balcony ? "Balcony" : null,
                          u.has_parking ? "Parking" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {(unitTypeFloorPlans[u.id] ?? []).length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-navy-800 pt-3">
                          {unitTypeFloorPlans[u.id].map((f) => (
                            <a
                              key={f.url}
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-gold-400 hover:text-gold-300"
                            >
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Amenities">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {project.amenities.map((a) => (
                  <div
                    key={a}
                    className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 text-sm text-ink-300"
                  >
                    <Building2 className="h-4 w-4 text-gold-400" />
                    {a}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Gallery">
              {images.length > 0 || exteriorImages.length > 0 || interiorImages.length > 0 ? (
                <GalleryLightbox
                  sections={[
                    { label: "Photos", images },
                    { label: "Exterior", images: exteriorImages },
                    { label: "Interior", images: interiorImages },
                  ]}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ProjectThumb
                        key={i}
                        gradient={project.gradient}
                        className="h-24 rounded-lg"
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-ink-500">
                    No photos uploaded by the developer yet.
                  </p>
                </>
              )}
            </Section>

            {(videoEmbedUrl || project.videoUrl || project.virtualTourUrl) && (
              <Section title="Video & Virtual Tour">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {project.videoUrl &&
                    (videoEmbedUrl ? (
                      <div className="aspect-video overflow-hidden rounded-lg border border-navy-700">
                        <iframe
                          src={videoEmbedUrl}
                          title="Project video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      </div>
                    ) : (
                      <a
                        href={project.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-navy-700 bg-navy-850 py-10 text-sm font-medium text-gold-400 hover:text-gold-300"
                      >
                        <Play className="h-4 w-4" /> Watch Video
                      </a>
                    ))}
                  {project.virtualTourUrl && (
                    <div className="aspect-video overflow-hidden rounded-lg border border-navy-700">
                      <iframe
                        src={project.virtualTourUrl}
                        title="360° virtual tour"
                        allow="xr-spatial-tracking; gyroscope; accelerometer"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  )}
                </div>
              </Section>
            )}

            <Section title="Master Plan, Floor Plans & Brochure">
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documentCategories
                    .filter((cat) => documents.some((d) => d.category === cat))
                    .map((cat) => (
                      <div key={cat}>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                          {cat}
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {documents
                            .filter((d) => d.category === cat)
                            .map((doc) => (
                              <a
                                key={doc.url}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-850 px-4 py-3 text-sm hover:border-gold-500/40"
                              >
                                <span className="flex min-w-0 items-center gap-2 truncate font-medium text-ink-100">
                                  <FileText className="h-4 w-4 shrink-0 text-gold-400" />
                                  <span className="truncate">{doc.name}</span>
                                </span>
                                <Download className="h-4 w-4 shrink-0 text-ink-500" />
                              </a>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-ink-500">
                  The developer hasn&apos;t uploaded a master plan, floor plans or
                  brochure for this project yet.
                </p>
              )}
            </Section>

            <Section title="Project Status">
              <div className="rounded-lg border border-navy-700 bg-navy-850 p-4">
                <p className="text-sm font-medium text-ink-100">
                  {getProjectStatusLabel(project)}
                </p>
                <p className="text-xs text-ink-500">
                  {project.handoverQuarter} {project.handoverYear} handover ·{" "}
                  {project.listingType === "ready" ? "Ready" : "Off-plan"}
                  {project.listingType === "ready" && project.buildingAgeYears != null && (
                    <> · {project.buildingAgeYears} {project.buildingAgeYears === 1 ? "year" : "years"} old</>
                  )}
                </p>

                {project.listingType !== "ready" && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-ink-500">
                      <span>Construction Progress</span>
                      <span>{project.constructionProgressPercent ?? 0}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-navy-800">
                      <div
                        className="h-full rounded-full bg-gold-500"
                        style={{ width: `${project.constructionProgressPercent ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {milestones.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-navy-800 pt-3">
                    {milestones.map((m) => (
                      <li key={m.id} className="flex items-center gap-2 text-xs">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            m.completed ? "bg-emerald-500" : "bg-navy-600"
                          }`}
                        />
                        <span className={m.completed ? "text-ink-300" : "text-ink-500"}>
                          {m.title}
                        </span>
                        {m.milestone_date && (
                          <span className="text-ink-600">
                            {new Date(m.milestone_date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Section>

            <Section title="Location">
              <div className="h-64 overflow-hidden rounded-lg border border-navy-700">
                <iframe
                  src={locationEmbedUrl}
                  title="Project location"
                  loading="lazy"
                  className="h-full w-full"
                />
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs text-ink-500">
                <MapPin className="h-3.5 w-3.5 text-gold-400" />
                {community?.name}, Dubai
              </p>
              {nearbyPoi.length > 0 && (
                <div className="mt-4 border-t border-navy-800 pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Nearby
                  </p>
                  <NearbyDistances items={nearbyPoi} />
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-6">
            <RequestPropertyPanel projectId={project.id} developerId={project.developerId} />
            <AgencyRequestPropertyPanel projectId={project.id} developerId={project.developerId} />

            <ProjectEnquiryPanel
              projectId={project.id}
              projectName={project.name}
              developerId={project.developerId}
              brochureUrl={brochureDoc?.url}
              developerPhone={developer?.phone}
            />

            {adsEnabled && <AdUnit slot={AD_SLOTS.projectDetailSidebar} />}

            <ProjectCalculatorsPanel priceAed={project.priceFromAed} paymentPlanDetails={project.paymentPlanDetails} />

            <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
              <p className="mb-2 text-sm font-semibold text-ink-100">Developer</p>
              <Link
                href={`/developers/${developer?.slug}`}
                className="flex items-center gap-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ background: developer?.color }}
                >
                  {developer?.initial}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink-100 hover:text-gold-400">
                    {developer?.name}
                    {developer?.verified && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-sky-400" />
                    )}
                  </p>
                  <p className="text-xs text-ink-500">
                    {developer?.verified ? "Verified developer" : "Developer"}
                    {developer?.founded ? ` · Since ${developer.founded}` : ""}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <Section title="Similar Projects Nearby">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {similar.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </PublicShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-sm font-medium text-ink-100">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-3 text-lg font-semibold text-ink-100">{title}</h2>
      {children}
    </section>
  );
}
