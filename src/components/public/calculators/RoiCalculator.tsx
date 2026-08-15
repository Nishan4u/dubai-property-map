"use client";

import { useMemo, useState } from "react";
import { NumberField, ResultCard, ResultRow } from "./fields";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { convertFromAed, convertToAed } from "@/lib/i18n/currency";
import { computeRoi } from "@/lib/calculators";

// A pure calculator over figures the user supplies themselves (purchase
// price, their own rent/expense estimates) -- it never states or implies
// a real ROI/rental-yield figure for a specific listing, matching the
// platform-wide rule (see AI Investment Advisor) that no such data exists
// anywhere in this schema.
export function RoiCalculator({ priceAed }: { priceAed?: number }) {
  const { currency, formatMoney } = useLocale();
  // Internal state always stays in AED (matches priceAed, which is real
  // AED data) -- only the NumberFields convert at the display boundary,
  // so the math below never needs to know about currency at all.
  const [price, setPrice] = useState(priceAed ?? 1500000);
  const [cashInvested, setCashInvested] = useState(Math.round((priceAed ?? 1500000) * 0.25));
  const [annualRent, setAnnualRent] = useState(Math.round((priceAed ?? 1500000) * 0.06));
  const [annualExpenses, setAnnualExpenses] = useState(Math.round((priceAed ?? 1500000) * 0.01));

  const { netAnnualIncome, cashOnCashRoi, grossRoi } = useMemo(
    () => computeRoi({ priceAed: price, cashInvested, annualRent, annualExpenses }),
    [price, cashInvested, annualRent, annualExpenses]
  );

  return (
    <div className="space-y-3">
      <NumberField
        label={`Purchase Price (${currency})`}
        value={convertFromAed(price, currency)}
        onChange={(v) => setPrice(convertToAed(v, currency))}
        step={10000}
      />
      <NumberField
        label={`Cash Invested (${currency}, down payment + fees)`}
        value={convertFromAed(cashInvested, currency)}
        onChange={(v) => setCashInvested(convertToAed(v, currency))}
        step={5000}
      />
      <NumberField
        label={`Estimated Annual Rent (${currency})`}
        value={convertFromAed(annualRent, currency)}
        onChange={(v) => setAnnualRent(convertToAed(v, currency))}
        step={1000}
      />
      <NumberField
        label={`Estimated Annual Expenses (${currency})`}
        value={convertFromAed(annualExpenses, currency)}
        onChange={(v) => setAnnualExpenses(convertToAed(v, currency))}
        step={500}
      />

      <ResultCard>
        <ResultRow label="Net Annual Income" value={formatMoney(netAnnualIncome)} />
        <ResultRow label="Gross ROI (on purchase price)" value={`${grossRoi.toFixed(2)}%`} />
        <ResultRow label="Cash-on-Cash ROI" value={`${cashOnCashRoi.toFixed(2)}%`} highlight />
      </ResultCard>
      <p className="text-[11px] text-ink-500">
        Based on your own rent/expense estimates — not a projection for this specific property.
      </p>
    </div>
  );
}
