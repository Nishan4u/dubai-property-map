"use client";

import { useMemo, useState } from "react";
import { NumberField, ResultCard, ResultRow } from "./fields";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { convertFromAed, convertToAed } from "@/lib/i18n/currency";

export function RentalYieldCalculator({ priceAed }: { priceAed?: number }) {
  const { currency } = useLocale();
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
      <NumberField
        label={`Property Price (${currency})`}
        value={convertFromAed(price, currency)}
        onChange={(v) => setPrice(convertToAed(v, currency))}
        step={10000}
      />
      <NumberField
        label={`Estimated Annual Rent (${currency})`}
        value={convertFromAed(annualRent, currency)}
        onChange={(v) => setAnnualRent(convertToAed(v, currency))}
        step={1000}
      />
      <NumberField
        label={`Annual Service Charge & Maintenance (${currency})`}
        value={convertFromAed(annualCosts, currency)}
        onChange={(v) => setAnnualCosts(convertToAed(v, currency))}
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
