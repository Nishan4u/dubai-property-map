"use client";

import { useMemo, useState } from "react";
import { NumberField, ResultCard, ResultRow, SelectField } from "./fields";

const SQFT_PER_UNIT: Record<string, number> = {
  sqft: 1,
  sqm: 10.7639,
  sqyd: 9,
};

const UNIT_LABELS: Record<string, string> = {
  sqft: "Square Feet (sq ft)",
  sqm: "Square Meters (sq m)",
  sqyd: "Square Yards (sq yd)",
};

const options = Object.keys(SQFT_PER_UNIT).map((u) => ({ value: u, label: UNIT_LABELS[u] }));

export function AreaConverter() {
  const [value, setValue] = useState(1000);
  const [unit, setUnit] = useState("sqft");

  const sqft = useMemo(() => value * SQFT_PER_UNIT[unit], [value, unit]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Area" value={value} onChange={setValue} step={10} />
        <SelectField label="Unit" value={unit} onChange={setUnit} options={options} />
      </div>

      <ResultCard>
        <ResultRow label="Square Feet" value={`${(sqft / SQFT_PER_UNIT.sqft).toLocaleString(undefined, { maximumFractionDigits: 2 })} sq ft`} />
        <ResultRow label="Square Meters" value={`${(sqft / SQFT_PER_UNIT.sqm).toLocaleString(undefined, { maximumFractionDigits: 2 })} sq m`} />
        <ResultRow label="Square Yards" value={`${(sqft / SQFT_PER_UNIT.sqyd).toLocaleString(undefined, { maximumFractionDigits: 2 })} sq yd`} />
      </ResultCard>
    </div>
  );
}
