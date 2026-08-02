"use client";

import { useMemo, useState } from "react";
import { NumberField, ResultCard, ResultRow, formatAedNumber } from "./fields";

// A pure calculator over figures the user supplies themselves (purchase
// price, their own rent/expense estimates) -- it never states or implies
// a real ROI/rental-yield figure for a specific listing, matching the
// platform-wide rule (see AI Investment Advisor) that no such data exists
// anywhere in this schema.
export function RoiCalculator({ priceAed }: { priceAed?: number }) {
  const [price, setPrice] = useState(priceAed ?? 1500000);
  const [cashInvested, setCashInvested] = useState(Math.round((priceAed ?? 1500000) * 0.25));
  const [annualRent, setAnnualRent] = useState(Math.round((priceAed ?? 1500000) * 0.06));
  const [annualExpenses, setAnnualExpenses] = useState(Math.round((priceAed ?? 1500000) * 0.01));

  const { netAnnualIncome, cashOnCashRoi, grossRoi } = useMemo(() => {
    const netAnnualIncome = annualRent - annualExpenses;
    const cashOnCashRoi = cashInvested > 0 ? (netAnnualIncome / cashInvested) * 100 : 0;
    const grossRoi = price > 0 ? (annualRent / price) * 100 : 0;
    return { netAnnualIncome, cashOnCashRoi, grossRoi };
  }, [price, cashInvested, annualRent, annualExpenses]);

  return (
    <div className="space-y-3">
      <NumberField label="Purchase Price (AED)" value={price} onChange={setPrice} step={10000} />
      <NumberField label="Cash Invested (down payment + fees)" value={cashInvested} onChange={setCashInvested} step={5000} />
      <NumberField label="Estimated Annual Rent (AED)" value={annualRent} onChange={setAnnualRent} step={1000} />
      <NumberField label="Estimated Annual Expenses (AED)" value={annualExpenses} onChange={setAnnualExpenses} step={500} />

      <ResultCard>
        <ResultRow label="Net Annual Income" value={formatAedNumber(netAnnualIncome)} />
        <ResultRow label="Gross ROI (on purchase price)" value={`${grossRoi.toFixed(2)}%`} />
        <ResultRow label="Cash-on-Cash ROI" value={`${cashOnCashRoi.toFixed(2)}%`} highlight />
      </ResultCard>
      <p className="text-[11px] text-ink-500">
        Based on your own rent/expense estimates — not a projection for this specific property.
      </p>
    </div>
  );
}
