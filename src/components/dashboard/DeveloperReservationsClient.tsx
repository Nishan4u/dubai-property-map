"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { CompactSelect } from "@/components/public/CompactSelect";
import type { ProjectUnitRow } from "@/types/database";

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
  projects: { name: string } | { name: string }[] | null;
  crm_clients: { full_name: string; email: string | null; phone: string | null } | { full_name: string; email: string | null; phone: string | null }[] | null;
}

const statusTone: Record<string, "neutral" | "gold" | "green" | "red" | "blue"> = {
  draft: "neutral",
  sent: "gold",
  viewed: "blue",
  signed: "green",
  cancelled: "red",
};

// Developers have no existing client-tracking UI, unlike broker/
// salesperson (crm_clients). This form captures the buyer's contact info
// inline and creates the crm_clients row (owner_type='developer') and
// the unit_reservations row together in one submit, rather than
// building a separate developer-side CRM screen they didn't ask for.
export function DeveloperReservationsClient({
  developerId,
  reservations: initialReservations,
  projects,
}: {
  developerId: string;
  reservations: Reservation[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [reservations, setReservations] = useState(initialReservations);
  const [showForm, setShowForm] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [projectId, setProjectId] = useState("");
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [unitTypeId, setUnitTypeId] = useState("");
  const [availableUnits, setAvailableUnits] = useState<ProjectUnitRow[]>([]);
  // "" = nothing picked yet, "__manual__" = fell back to free-text entry
  // (no inventory configured, or the buyer's unit isn't in the list yet).
  const [unitId, setUnitId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [priceAed, setPriceAed] = useState("");
  const [depositAed, setDepositAed] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();
    let query = supabase.from("project_units").select("*").eq("project_id", projectId).eq("status", "available").order("unit_number");
    if (unitTypeId) query = query.eq("unit_type_id", unitTypeId);
    query.then(({ data }) => setAvailableUnits(data ?? []));
  }, [projectId, unitTypeId]);

  function handleSelectProject(id: string) {
    setProjectId(id);
    setUnitTypeId("");
    setUnitTypes([]);
    setAvailableUnits([]);
    setUnitId("");
    setUnitNumber("");
  }

  function handleSelectUnitType(id: string) {
    setUnitTypeId(id);
    setUnitId("");
    setUnitNumber("");
    const unitType = unitTypes.find((u) => u.id === id);
    if (unitType?.starting_price_aed && !priceAed) {
      setPriceAed(String(unitType.starting_price_aed));
    }
  }

  function handleSelectUnit(id: string) {
    setUnitId(id);
    if (id === "__manual__") {
      setUnitNumber("");
      return;
    }
    const unit = availableUnits.find((u) => u.id === id);
    setUnitNumber(unit?.unit_number ?? "");
    if (unit?.price_aed && !priceAed) setPriceAed(String(unit.price_aed));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!buyerName.trim() || !projectId || !priceAed) return;
    setSaving(true);
    setError("");
    const supabase = createClient();

    const { data: client, error: clientError } = await supabase
      .from("crm_clients")
      .insert({
        owner_type: "developer",
        developer_id: developerId,
        full_name: buyerName.trim(),
        email: buyerEmail.trim() || null,
        phone: buyerPhone.trim() || null,
        source: "other",
      })
      .select("id")
      .single();

    if (clientError || !client) {
      setError(clientError?.message ?? "Failed to create buyer record.");
      setSaving(false);
      return;
    }

    // unit_id is only spread in when a real unit was picked -- keeps this
    // insert working against a database that hasn't run patch_105 yet
    // (no unit_id column at all) for the common case of no unit chosen.
    const realUnitId = unitId && unitId !== "__manual__" ? unitId : null;
    const { data: reservation, error: reservationError } = await supabase
      .from("unit_reservations")
      .insert({
        client_id: client.id,
        project_id: projectId,
        unit_type_id: unitTypeId || null,
        unit_number: unitNumber.trim() || null,
        price_aed: Number(priceAed),
        deposit_amount_aed: depositAed ? Number(depositAed) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        ...(realUnitId ? { unit_id: realUnitId } : {}),
      })
      .select("*, projects(name), crm_clients(full_name, email, phone)")
      .single();

    if (reservationError || !reservation) {
      setError(reservationError?.message ?? "Failed to create reservation.");
      setSaving(false);
      return;
    }

    setReservations((prev) => [reservation, ...prev]);
    setShowForm(false);
    setBuyerName("");
    setBuyerEmail("");
    setBuyerPhone("");
    setProjectId("");
    setUnitTypeId("");
    setAvailableUnits([]);
    setUnitId("");
    setUnitNumber("");
    setPriceAed("");
    setDepositAed("");
    setExpiresAt("");
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
    const res = await fetch(`/api/reservations/cancel/${id}`, { method: "POST" });
    if (res.ok) {
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    } else {
      const data = await res.json();
      window.alert(data.error ?? "Failed to cancel reservation.");
    }
  }

  const now = new Date();

  return (
    <SectionCard
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
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Buyer</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Full Name</label>
            <input
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Phone</label>
            <input
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 border-t border-navy-800 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Reservation</p>
          </div>
          <div>
            <CompactSelect
              label="Project"
              placeholder="Select a project…"
              value={projectId}
              onChange={handleSelectProject}
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
            />
          </div>
          <div>
            <CompactSelect
              label="Unit Type (optional)"
              placeholder="Select a unit type…"
              value={unitTypeId}
              onChange={handleSelectUnitType}
              disabled={!projectId}
              options={unitTypes.map((u) => ({ label: u.unit_name ?? u.unit_type ?? "", value: u.id }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Unit (optional)</label>
            {availableUnits.length > 0 && unitId !== "__manual__" ? (
              <CompactSelect
                label="Unit (optional)"
                hideLabel
                placeholder="Select a unit…"
                value={unitId}
                onChange={handleSelectUnit}
                options={[
                  ...availableUnits.map((u) => ({
                    label: `Unit ${u.unit_number}${u.floor ? ` · Floor ${u.floor}` : ""}${
                      u.price_aed != null ? ` · AED ${u.price_aed.toLocaleString()}` : ""
                    }`,
                    value: u.id,
                  })),
                  { label: "Other (type manually)", value: "__manual__" },
                ]}
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g. 1204"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                />
                {availableUnits.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setUnitId("");
                      setUnitNumber("");
                    }}
                    className="shrink-0 text-xs font-medium text-gold-400 hover:text-gold-300"
                  >
                    Pick from list
                  </button>
                )}
              </div>
            )}
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

          {error && <p className="text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>}

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
            const client = Array.isArray(r.crm_clients) ? r.crm_clients[0] : r.crm_clients;
            const expired = r.expires_at && new Date(r.expires_at) < now && ["sent", "viewed"].includes(r.status);
            return (
              <div key={r.id} className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-ink-100">
                      {client?.full_name ?? "—"} <span className="text-ink-500">· {project?.name ?? "—"}</span>{" "}
                      {r.unit_number && <span className="text-ink-500">· Unit {r.unit_number}</span>}
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
