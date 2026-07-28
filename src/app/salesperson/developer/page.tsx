import { createClient } from "@/lib/supabase/server";
import { ChangeDeveloperForm } from "@/components/salesperson/ChangeDeveloperForm";

export const dynamic = "force-dynamic";

export default async function SalespersonDeveloperPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("salesperson_id").eq("id", user!.id).single();

  const { data: salesperson } = await supabase
    .from("salespersons")
    .select("developer_id, developers(name, slug)")
    .eq("id", profile!.salesperson_id)
    .single();

  const { data: history } = await supabase
    .from("salesperson_developer_history")
    .select("started_at, ended_at, developers(name)")
    .eq("salesperson_id", profile!.salesperson_id!)
    .order("started_at", { ascending: false });

  const { data: developers } = await supabase.from("developers").select("id, name").eq("status", "active").order("name");

  const currentDeveloper = salesperson?.developers as { name?: string; slug?: string } | { name?: string; slug?: string }[] | null;
  const developerName = Array.isArray(currentDeveloper) ? currentDeveloper[0]?.name : currentDeveloper?.name;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Developer</h1>
        <p className="text-sm text-ink-400">
          Your subscription stays active no matter which developer you&apos;re connected to.
        </p>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <p className="text-xs text-ink-500">Currently Connected To</p>
        <p className="mt-1 text-lg font-semibold text-ink-100">{developerName ?? "No developer connected"}</p>
      </div>

      <ChangeDeveloperForm developers={developers ?? []} currentDeveloperId={salesperson?.developer_id ?? null} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-200">History</h2>
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
          {(history ?? []).length === 0 && <p className="px-4 py-3 text-xs text-ink-500">No history yet.</p>}
        </div>
      </div>
    </div>
  );
}
