"use client";

import { useMemo, useState } from "react";
import { NumberField, ResultCard, ResultRow } from "./fields";

export function RentalYieldCalculator({ priceAed }: { priceAed?: number }) {
  const [price, setPrice] = useState(priceAed ?? 1500000);
  const [annualRent, setAnnualRent] = useState(Math.round((priceAed ?? 1500000) * 0.06));
  const [annualCosts, setAnnualCosts] = useState(Math.round((priceAed ?? 1500000) * 0.008));

  const { grossYield, netYield } = useMemo(() => {
    const grossYield = price > 0 ? (annualRent / price) * 100 : 0;
    const netYield = price > 0 ? ((annualRent - annualCosts) / price) * 100 : 0;
    return { grossYield, netYield };
  }, [price, annualRent, annualCosts]);

  return (
    <div className="space-y-3">
      <NumberField label="Property Price (AED)" value={price} onChange={setPrice} step={10000} />
      <NumberField label="Estimated Annual Rent (AED)" value={annualRent} onChange={setAnnualRent} step={1000} />
      <NumberField
        label="Annual Service Charge & Maintenance (AED)"
        value={annualCosts}
        onChange={setAnnualCosts}
        step={500}
      />

      <ResultCard>
        <ResultRow label="Gross Rental Yield" value={`${grossYield.toFixed(2)}%`} />
        <ResultRow label="Net Rental Yield" value={`${netYield.toFixed(2)}%`} highlight />
      </ResultCard>
      <p className="text-[11px] text-ink-500">
        Based on your own rent/cost estimates — not a projection for this specific property.
      </p>
    </div>
  );
}
