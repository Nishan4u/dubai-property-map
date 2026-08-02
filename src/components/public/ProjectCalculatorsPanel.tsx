"use client";

import { useState } from "react";
import { MortgageCalculator } from "@/components/public/MortgageCalculator";
import { RoiCalculator } from "@/components/public/calculators/RoiCalculator";
import { RentalYieldCalculator } from "@/components/public/calculators/RentalYieldCalculator";
import { DldFeeCalculator } from "@/components/public/calculators/DldFeeCalculator";
import { PaymentPlanCalculator } from "@/components/public/calculators/PaymentPlanCalculator";

const TABS = [
  { id: "mortgage", label: "Mortgage" },
  { id: "roi", label: "ROI" },
  { id: "yield", label: "Yield" },
  { id: "dld", label: "DLD Fee" },
  { id: "plan", label: "Payment Plan" },
];

export function ProjectCalculatorsPanel({
  priceAed,
  paymentPlanDetails,
}: {
  priceAed: number;
  paymentPlanDetails?: { label: string; percent: number }[];
}) {
  const [tab, setTab] = useState("mortgage");

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
      <p className="mb-3 text-sm font-semibold text-ink-100">Calculators</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              tab === t.id ? "bg-gold-500 text-navy-950" : "bg-navy-800 text-ink-400 hover:text-ink-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mortgage" && <MortgageCalculator priceAed={priceAed} />}
      {tab === "roi" && <RoiCalculator priceAed={priceAed} />}
      {tab === "yield" && <RentalYieldCalculator priceAed={priceAed} />}
      {tab === "dld" && <DldFeeCalculator priceAed={priceAed} />}
      {tab === "plan" && <PaymentPlanCalculator priceAed={priceAed} paymentPlanDetails={paymentPlanDetails} />}
    </div>
  );
}
