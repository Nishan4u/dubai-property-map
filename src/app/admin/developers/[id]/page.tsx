import { notFound } from "next/navigation";
import { BadgeCheck, Star } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { developers, getDeveloper, projectsForDeveloper } from "@/data/mock";

export default async function AdminDeveloperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const developer = getDeveloper(id);
  if (!developer) notFound();

  const devProjects = projectsForDeveloper(developer.id);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ background: developer.color }}
          >
            {developer.initial}
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold text-ink-100">
              {developer.name}
              {developer.verified && <BadgeCheck className="h-4 w-4 text-sky-400" />}
            </h1>
            <p className="flex items-center gap-1 text-xs text-ink-500">
              <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
              {developer.rating} · {developer.reviews} reviews · Since {developer.founded}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25">
            Approve
          </button>
          <button className="rounded-lg bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/25">
            Suspend
          </button>
          <button className="rounded-lg bg-gold-500/15 px-4 py-2 text-sm font-medium text-gold-400 hover:bg-gold-500/25">
            Feature
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Total Projects" value={developer.projectsCount} />
        <MiniStat label="Completed" value={developer.completedCount} />
        <MiniStat label="Under Construction" value={developer.underConstructionCount} />
        <MiniStat label="Subscription" value="Professional" isText />
      </div>

      <p className="max-w-3xl text-sm text-ink-300">{developer.description}</p>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-100">Projects</h2>
        <DataTable
          columns={[
            { header: "Project", render: (p) => <span className="font-medium text-ink-100">{p.name}</span> },
            { header: "Status", render: (p) => <Badge tone="green">{p.status}</Badge> },
            { header: "Views", render: (p) => p.views.toLocaleString() },
            { header: "Leads", render: (p) => p.leads },
          ]}
          rows={devProjects}
        />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return developers.map((d) => ({ id: d.id }));
}

function MiniStat({
  label,
  value,
  isText,
}: {
  label: string;
  value: string | number;
  isText?: boolean;
}) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <p className="text-xs text-ink-400">{label}</p>
      <p className={`mt-1 font-semibold text-ink-100 ${isText ? "text-sm" : "text-xl"}`}>
        {value}
      </p>
    </div>
  );
}
