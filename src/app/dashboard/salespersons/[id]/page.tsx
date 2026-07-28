import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function SalespersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireDeveloperProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: salesperson } = await supabase
    .from("salespersons")
    .select("*")
    .eq("id", id)
    .eq("developer_id", profile.developer_id)
    .maybeSingle();
  if (!salesperson) notFound();

  const { data: history } = await supabase
    .from("salesperson_developer_history")
    .select("started_at, ended_at, developers(name)")
    .eq("salesperson_id", id)
    .order("started_at", { ascending: false });

  return (
    <div className="space-y-4 p-6">
      <Link href="/dashboard/salespersons" className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-300">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Salespersons
      </Link>

      <div className="flex items-center gap-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
        {salesperson.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={salesperson.photo_url} alt={salesperson.full_name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xl font-bold text-navy-950">
            {salesperson.full_name.charAt(0)}
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold text-ink-100">{salesperson.full_name}</h1>
          <p className="text-sm text-ink-400">{salesperson.job_title ?? "—"}</p>
          <Badge tone={salesperson.status === "active" ? "green" : "neutral"} className="mt-1">
            {salesperson.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Email</p>
          <p className="mt-1 text-sm text-ink-100">{salesperson.email}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Employee ID</p>
          <p className="mt-1 text-sm text-ink-100">{salesperson.employee_id ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Mobile</p>
          <p className="mt-1 text-sm text-ink-100">{salesperson.mobile ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">WhatsApp</p>
          <p className="mt-1 text-sm text-ink-100">{salesperson.whatsapp ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Joined Your Roster</p>
          <p className="mt-1 text-sm text-ink-100">{new Date(salesperson.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-200">Developer History</h2>
        <div className="divide-y divide-navy-800 rounded-xl border border-navy-700 bg-navy-850">
          {(history ?? []).map((h, i) => {
            const dev = h.developers as { name?: string } | { name?: string }[] | null;
            const name = Array.isArray(dev) ? dev[0]?.name : dev?.name;
            return (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-ink-100">{name ?? "—"}</span>
                <span className="text-xs text-ink-500">
                  {new Date(h.started_at).toLocaleDateString()} — {h.ended_at ? new Date(h.ended_at).toLocaleDateString() : "Present"}
                </span>
              </div>
            );
          })}
          {(history ?? []).length === 0 && <p className="px-4 py-3 text-xs text-ink-500">No history on file.</p>}
        </div>
      </div>
    </div>
  );
}
