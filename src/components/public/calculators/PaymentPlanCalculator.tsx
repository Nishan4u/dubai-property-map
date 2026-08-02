"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { NumberField, formatAedNumber } from "./fields";

interface Milestone {
  label: string;
  percent: number;
}

const DEFAULT_MILESTONES: Milestone[] = [
  { label: "On Booking", percent: 20 },
  { label: "During Construction", percent: 50 },
  { label: "On Handover", percent: 30 },
];

export function PaymentPlanCalculator({
  priceAed,
  paymentPlanDetails,
}: {
  priceAed?: number;
  paymentPlanDetails?: Milestone[];
}) {
  const [price, setPrice] = useState(priceAed ?? 1500000);
  const [milestones, setMilestones] = useState<Milestone[]>(
    paymentPlanDetails && paymentPlanDetails.length > 0 ? paymentPlanDetails : DEFAULT_MILESTONES
  );
  const usingProjectPlan = Boolean(paymentPlanDetails && paymentPlanDetails.length > 0);

  const totalPercent = useMemo(() => milestones.reduce((sum, m) => sum + m.percent, 0), [milestones]);

  function updateMilestone(index: number, field: keyof Milestone, value: string | number) {
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function addMilestone() {
    setMilestones((prev) => [...prev, { label: "New Milestone", percent: 0 }]);
  }

  function removeMilestone(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <NumberField label="Total Property Price (AED)" value={price} onChange={setPrice} step={10000} />

      {usingProjectPlan && (
        <p className="text-[11px] text-ink-500">Pre-filled from this project&apos;s published payment plan.</p>
      )}

      <div className="space-y-2">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={m.label}
              onChange={(e) => updateMilestone(i, "label", e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-navy-600 bg-navy-800 px-2 py-1.5 text-xs text-ink-100 focus:outline-none"
            />
            <div className="relative w-20 shrink-0">
              <input
                type="number"
                value={m.percent}
                onChange={(e) => updateMilestone(i, "percent", Number(e.target.value))}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2 py-1.5 text-xs text-ink-100 focus:outline-none"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink-500">%</span>
            </div>
            <p className="w-24 shrink-0 text-right text-xs font-medium text-ink-200">
              {formatAedNumber((price * m.percent) / 100)}
            </p>
            <button
              type="button"
              onClick={() => removeMilestone(i)}
              className="shrink-0 text-ink-500 hover:text-rose-400"
              aria-label="Remove milestone"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMilestone}
        className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300"
      >
        <Plus className="h-3.5 w-3.5" /> Add Milestone
      </button>

      <div className="rounded-lg bg-navy-800 p-3">
        <p className="text-xs text-ink-400">Total Allocated</p>
        <p className={`text-lg font-semibold ${totalPercent === 100 ? "text-gold-400" : "text-rose-400"}`}>
          {totalPercent}%{totalPercent !== 100 && " (should total 100%)"}
        </p>
      </div>
    </div>
  );
}
