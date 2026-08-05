"use client";

import { useMemo, useState } from "react";
import { NumberField, ResultCard, ResultRow, SliderField } from "./fields";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { convertFromAed, convertToAed } from "@/lib/i18n/currency";

const MAX_DEBT_BURDEN_RATIO = 0.5; // UAE Central Bank guidance: total debt obligations capped at 50% of income

export function AffordabilityCalculator() {
  const { currency, formatMoney } = useLocale();
  const [monthlyIncome, setMonthlyIncome] = useState(30000);
  const [monthlyDebts, setMonthlyDebts] = useState(2000);
  const [downPayment, setDownPayment] = useState(300000);
  const [rate, setRate] = useState(4.5);
  const [years, setYears] = useState(25);

  const { maxMonthlyPayment, maxLoan, maxPrice } = useMemo(() => {
    const maxMonthlyPayment = Math.max(0, monthlyIncome * MAX_DEBT_BURDEN_RATIO - monthlyDebts);
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    const maxLoan =
      monthlyRate === 0
        ? maxMonthlyPayment * n
        : (maxMonthlyPayment * (Math.pow(1 + monthlyRate, n) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, n));
    return { maxMonthlyPayment, maxLoan, maxPrice: maxLoan + downPayment };
  }, [monthlyIncome, monthlyDebts, downPayment, rate, years]);

  return (
    <div className="space-y-3">
      <NumberField
        label={`Monthly Income (${currency})`}
        value={convertFromAed(monthlyIncome, currency)}
        onChange={(v) => setMonthlyIncome(convertToAed(v, currency))}
        step={1000}
      />
      <NumberField
        label={`Existing Monthly Debts (${currency})`}
        value={convertFromAed(monthlyDebts, currency)}
        onChange={(v) => setMonthlyDebts(convertToAed(v, currency))}
        step={500}
      />
      <NumberField
        label={`Down Payment Available (${currency})`}
        value={convertFromAed(downPayment, currency)}
        onChange={(v) => setDownPayment(convertToAed(v, currency))}
        step={10000}
      />
      <SliderField label="Interest Rate" value={rate} onChange={setRate} min={2} max={8} step={0.1} suffix="%" />
      <SliderField label="Tenure" value={years} onChange={setYears} min={5} max={30} suffix=" yrs" />

      <ResultCard>
        <ResultRow label="Max Affordable Monthly Payment" value={formatMoney(maxMonthlyPayment)} />
        <ResultRow label="Max Loan Amount" value={formatMoney(maxLoan)} />
        <ResultRow label="Max Affordable Property Price" value={formatMoney(maxPrice)} highlight />
      </ResultCard>
      <p className="text-[11px] text-ink-500">
        Based on a 50% debt-burden cap (UAE Central Bank guidance) — actual bank approval may differ.
      </p>
    </div>
  );
}
