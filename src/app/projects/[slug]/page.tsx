import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  Calendar,
  Download,
  MapPin,
  Play,
  Star,
} from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { MortgageCalculator } from "@/components/public/MortgageCalculator";
import { ProjectCard } from "@/components/public/ProjectCard";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { Badge } from "@/components/ui/Badge";
import {
  formatAed,
  getCommunity,
  getDeveloper,
  getProject,
  projects,
} from "@/data/mock";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const developer = getDeveloper(project.developerId);
  const community = getCommunity(project.communityId);
  const similar = projects
    .filter((p) => p.id !== project.id && p.communityId === project.communityId)
    .slice(0, 3);

  return (
    <PublicShell>
      <ProjectThumb gradient={project.gradient} className="h-64 w-full sm:h-72" />

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-6">
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
              <p className="text-xs text-ink-500">Starting From</p>
              <p className="text-2xl font-bold text-gold-400">
                {formatAed(project.priceFromAed)}
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

            <Section title="Gallery & Virtual Tour">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProjectThumb
                    key={i}
                    gradient={project.gradient}
                    className="h-24 rounded-lg"
                  />
                ))}
              </div>
              <button className="mt-3 flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300">
                <Play className="h-4 w-4" /> Watch 360° Virtual Tour
              </button>
            </Section>

            <Section title="Floor Plans">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {project.unitTypes.map((u) => (
                  <div
                    key={u}
                    className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-850 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-ink-100">{u} Layout</span>
                    <span className="text-ink-500">View PDF</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Construction Updates">
              <div className="flex items-center gap-4 rounded-lg border border-navy-700 bg-navy-850 p-4">
                <div className="relative h-16 w-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#17213a" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#e3ab3d"
                      strokeWidth="4"
                      strokeDasharray={`${(project.leads % 100)} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-ink-100">
                    {project.leads % 100}%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-100">
                    Construction in progress
                  </p>
                  <p className="text-xs text-ink-500">
                    Last milestone photo update: 2 weeks ago
                  </p>
                </div>
              </div>
            </Section>

            <Section title="Location">
              <div className="flex h-48 items-center justify-center rounded-lg border border-navy-700 bg-[radial-gradient(circle_at_30%_20%,#0f2035,#0a1526_55%,#070d18)] text-sm text-ink-500">
                <MapPin className="mr-2 h-4 w-4 text-gold-400" />
                {community?.name}, Dubai — interactive map on homepage
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
              <p className="text-sm font-semibold text-ink-100">
                Interested in this project?
              </p>
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400">
                <Calendar className="h-4 w-4" /> Book Appointment
              </button>
              <button className="mt-2 w-full rounded-lg border border-emerald-600/40 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10">
                WhatsApp Agent
              </button>
              <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-navy-600 py-2.5 text-sm font-medium text-ink-300 hover:text-ink-100">
                <Download className="h-4 w-4" /> Download Brochure
              </button>
            </div>

            <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
              <p className="mb-3 text-sm font-semibold text-ink-100">
                Mortgage Calculator
              </p>
              <MortgageCalculator priceAed={project.priceFromAed} />
            </div>

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
                  <p className="text-sm font-medium text-ink-100 hover:text-gold-400">
                    {developer?.name}
                  </p>
                  <p className="text-xs text-ink-500">
                    {developer?.projectsCount} Projects · {developer?.rating}★
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
