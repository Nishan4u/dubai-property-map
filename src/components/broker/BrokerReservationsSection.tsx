"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";

interface UnitType {
  id: string;
  unit_name: string | null;
  unit_type: string | null;
  starting_price_aed: number | null;
}

interface Reservation {
  id: string;
  unit_number: string | null;
  price_aed: number;
  deposit_amount_aed: number | null;
  status: string;
  expires_at: string | null;
  sign_token: string;
  signed_at: string | null;
  projects: { name: string } | { name: string }[] | null;
}

const statusTone: Record<string, "neutral" | "gold" | "green" | "red" | "blue"> = {
  draft: "neutral",
  sent: "gold",
  viewed: "blue",
  signed: "green",
  cancelled: "red",
};

// Deliberately its own component, not shared with the salesperson portal
// -- matches this codebase's established convention (see
// SalespersonReferralClient.tsx's own header comment) of keeping
// broker/salesperson business components separate even when near-identical.
export function BrokerReservationsSection({
  clientId,
  reservations: initialReservations,
  projects,
}: {
  clientId: string;
  reservations: Reservation[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [reservations, setReservations] = useState(initialReservations);
  const [showForm, setShowForm] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [unitTypeId, setUnitTypeId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [priceAed, setPriceAed] = useState("");
  const [depositAed, setDepositAed] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState("");

  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();
    supabase
      .from("project_unit_types")
      .select("id, unit_name, unit_type, starting_price_aed")
      .eq("project_id", projectId)
      .then(({ data }) => setUnitTypes(data ?? []));
  }, [projectId]);

  function handleSelectProject(id: string) {
    setProjectId(id);
    setUnitTypeId("");
    setUnitTypes([]);
  }

  function handleSelectUnitType(id: string) {
    setUnitTypeId(id);
    const unitType = unitTypes.find((u) => u.id === id);
    if (unitType?.starting_price_aed && !priceAed) {
      setPriceAed(String(unitType.starting_price_aed));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !priceAed) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("unit_reservations")
      .insert({
        client_id: clientId,
        project_id: projectId,
        unit_type_id: unitTypeId || null,
        unit_number: unitNumber.trim() || null,
        price_aed: Number(priceAed),
        deposit_amount_aed: depositAed ? Number(depositAed) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      .select("*, projects(name)")
      .single();

    if (!error && data) {
      setReservations((prev) => [data, ...prev]);
      setShowForm(false);
      setProjectId("");
      setUnitTypeId("");
      setUnitNumber("");
      setPriceAed("");
      setDepositAed("");
      setExpiresAt("");
    }
    setSaving(false);
  }

  async function handleSend(id: string) {
    setSendingId(id);
    const res = await fetch(`/api/reservations/send/${id}`, { method: "POST" });
    setSendingId("");
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      window.alert(data.error ?? "Failed to send reservation.");
    }
  }

  async function handleCancel(id: string) {
    if (!window.confirm("Cancel this reservation?")) return;
    const supabase = createClient();
    await supabase.from("unit_reservations").update({ status: "cancelled" }).eq("id", id);
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
  }

  const now = new Date();

  return (
    <SectionCard
      title="Reservations"
      action={
        !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-medium text-gold-400 hover:text-gold-300">
            + New Reservation
          </button>
        )
      }
    >
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-navy-700 bg-navy-900 p-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Project</label>
            <select
              required
              value={projectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Unit Type (optional)</label>
            <select
              value={unitTypeId}
              onChange={(e) => handleSelectUnitType(e.target.value)}
              disabled={!projectId}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none disabled:opacity-50"
            >
              <option value="">Select a unit type…</option>
              {unitTypes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_name ?? u.unit_type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Unit Number (optional)</label>
            <input
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="e.g. 1204"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Price (AED)</label>
            <input
              required
              type="number"
              value={priceAed}
              onChange={(e) => setPriceAed(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Deposit (AED, optional)</label>
            <input
              type="number"
              value={depositAed}
              onChange={(e) => setDepositAed(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Expires (optional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create Draft"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reservations.length === 0 ? (
        <p className="text-sm text-ink-500">No reservations yet.</p>
      ) : (
        <div className="space-y-1.5">
          {reservations.map((r) => {
            const project = Array.isArray(r.projects) ? r.projects[0] : r.projects;
            const expired = r.expires_at && new Date(r.expires_at) < now && ["sent", "viewed"].includes(r.status);
            return (
              <div key={r.id} className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-ink-100">
                      {project?.name ?? "—"} {r.unit_number && <span className="text-ink-500">· Unit {r.unit_number}</span>}
                    </p>
                    <p className="text-xs text-ink-500">
                      AED {Math.round(r.price_aed).toLocaleString()}
                      {r.deposit_amount_aed ? ` · Deposit AED ${Math.round(r.deposit_amount_aed).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={expired ? "red" : statusTone[r.status]}>{expired ? "expired" : r.status}</Badge>
                    {r.status === "draft" && (
                      <button
                        onClick={() => handleSend(r.id)}
                        disabled={sendingId === r.id}
                        className="text-xs font-medium text-gold-400 hover:text-gold-300 disabled:opacity-60"
                      >
                        {sendingId === r.id ? "Sending…" : "Send"}
                      </button>
                    )}
                    {["draft", "sent", "viewed"].includes(r.status) && (
                      <button onClick={() => handleCancel(r.id)} className="text-xs font-medium text-rose-400 hover:text-rose-300">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
