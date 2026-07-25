"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

interface SalespersonOption {
  id: string;
  full_name: string;
  job_title: string | null;
  photo_url: string | null;
}

const propertyTypes = ["Apartment", "Villa", "Townhouse", "Penthouse", "Duplex"];
const bedroomOptions = ["Studio", "1BR", "2BR", "3BR", "4BR", "5+BR"];
const purposeOptions = ["Investment", "End Use"];
const financingOptions = ["Cash", "Mortgage"];
const timelineOptions = ["Immediate", "1-3 Months", "3-6 Months", "6-12 Months", "12+ Months"];

export function PropertyRequestForm({
  projectId,
  salespersons,
  rememberedSalespersonId,
}: {
  projectId: string;
  salespersons: SalespersonOption[];
  rememberedSalespersonId: string | null;
}) {
  const [propertyType, setPropertyType] = useState(propertyTypes[0]);
  const [bedrooms, setBedrooms] = useState(bedroomOptions[0]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [purchasePurpose, setPurchasePurpose] = useState(purposeOptions[0]);
  const [financing, setFinancing] = useState(financingOptions[0]);
  const [purchaseTimeline, setPurchaseTimeline] = useState(timelineOptions[0]);
  const [preferredUnit, setPreferredUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [salespersonId, setSalespersonId] = useState(rememberedSalespersonId ?? salespersons[0]?.id ?? "");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);

  if (salespersons.length === 0) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5 text-sm text-ink-400">
        This developer has no active salespersons yet — check back soon.
      </div>
    );
  }

  if (requestId) {
    return (
      <div className="rounded-xl border border-emerald-600/40 bg-emerald-500/10 p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
        <p className="mt-2 text-sm font-semibold text-emerald-300">Request submitted</p>
        <p className="mt-1 text-xs text-ink-400">
          Reference <span className="font-mono text-ink-200">{requestId}</span> — the salesperson has been
          notified and will contact you directly.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await fetch("/api/broker/property-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        salespersonId,
        propertyType,
        bedrooms,
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        purchasePurpose,
        financing,
        purchaseTimeline,
        preferredUnit,
        notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Could not submit your request.");
      setLoading(false);
      return;
    }
    setRequestId(data.requestId);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-100">
        <Send className="h-4 w-4 text-gold-400" /> Request Property
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Property Type</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 focus:outline-none"
          >
            {propertyTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Bedrooms</label>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 focus:outline-none"
          >
            {bedroomOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Budget From (AED)</label>
          <input
            type="number"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Budget To (AED)</label>
          <input
            type="number"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Purchase Purpose</label>
          <select
            value={purchasePurpose}
            onChange={(e) => setPurchasePurpose(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 focus:outline-none"
          >
            {purposeOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Payment Method</label>
          <select
            value={financing}
            onChange={(e) => setFinancing(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 focus:outline-none"
          >
            {financingOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Purchase Timeline</label>
        <select
          value={purchaseTimeline}
          onChange={(e) => setPurchaseTimeline(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 focus:outline-none"
        >
          {timelineOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Preferred Unit (optional)</label>
        <input
          value={preferredUnit}
          onChange={(e) => setPreferredUnit(e.target.value)}
          placeholder="e.g. High floor, pool view"
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Select Developer Salesperson</label>
        <select
          value={salespersonId}
          onChange={(e) => setSalespersonId(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 text-xs text-ink-100 focus:outline-none"
        >
          {salespersons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
              {s.job_title ? ` — ${s.job_title}` : ""}
            </option>
          ))}
        </select>
        {rememberedSalespersonId && salespersons.some((s) => s.id === rememberedSalespersonId) && (
          <p className="mt-1 text-[11px] text-ink-500">
            Pre-selected: your usual salesperson for this developer.
          </p>
        )}
      </div>

      {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit Property Request"}
      </button>
    </form>
  );
}
