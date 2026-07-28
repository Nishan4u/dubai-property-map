import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "green" | "gold" | "red" | "neutral"> = {
  approved: "green",
  pending_verification: "gold",
  rejected: "red",
  suspended: "red",
  blocked: "red",
};

export default async function BrokerAgencyBrokerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("broker_agency_id").eq("id", user!.id).single();

  const { data: broker } = await supabase
    .from("brokers")
    .select("*")
    .eq("id", id)
    .eq("brokerage_id", profile!.broker_agency_id)
    .maybeSingle();
  if (!broker) notFound();

  const { data: history } = await supabase
    .from("broker_agency_history")
    .select("started_at, ended_at, became_independent, brokerages(name)")
    .eq("broker_id", id)
    .order("started_at", { ascending: false });

  return (
    <div className="space-y-4 p-6">
      <Link href="/broker-agency/brokers" className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-300">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Brokers
      </Link>

      <div className="flex items-center gap-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
        {broker.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={broker.photo_url} alt={broker.full_name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xl font-bold text-navy-950">
            {broker.full_name.charAt(0)}
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold text-ink-100">{broker.full_name}</h1>
          <p className="text-sm text-ink-400">BRN {broker.brn} · ORN {broker.orn}</p>
          <div className="mt-1 flex gap-2">
            <Badge tone={statusTone[broker.account_status] ?? "neutral"}>{broker.account_status.replace(/_/g, " ")}</Badge>
            <Badge tone={broker.subscription_status === "active" ? "green" : "neutral"}>
              {broker.subscription_status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Email</p>
          <p className="mt-1 text-sm text-ink-100">{broker.email}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Mobile</p>
          <p className="mt-1 text-sm text-ink-100">{broker.mobile}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">WhatsApp</p>
          <p className="mt-1 text-sm text-ink-100">{broker.whatsapp}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs text-ink-500">Joined Your Roster</p>
          <p className="mt-1 text-sm text-ink-100">{new Date(broker.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-200">Agency History</h2>
        <div className="divide-y divide-navy-800 rounded-xl border border-navy-700 bg-navy-850">
          {(history ?? []).map((h, i) => {
            const agency = h.brokerages as { name?: string } | { name?: string }[] | null;
            const name = Array.isArray(agency) ? agency[0]?.name : agency?.name;
            return (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-ink-100">{name ?? "Independent Broker"}</span>
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
