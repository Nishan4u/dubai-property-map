"use client";

import { useMemo, useState } from "react";
import { NumberField, ResultCard, ResultRow, formatAedNumber } from "./fields";

const DLD_RATE = 0.04;
const DLD_ADMIN_FEE = 580;
const AGENT_COMMISSION_RATE = 0.02;
const MORTGAGE_REG_RATE = 0.0025;
const MORTGAGE_REG_ADMIN_FEE = 290;

// Standard, publicly-published Dubai Land Department transfer-fee
// structure (4% + AED 580 trustee admin fee), not project- or
// listing-specific data -- same category of fixed government fee as the
// existing Mortgage Calculator's interest-rate assumption.
export function DldFeeCalculator({ priceAed }: { priceAed?: number }) {
  const [price, setPrice] = useState(priceAed ?? 1500000);
  const [includeAgentCommission, setIncludeAgentCommission] = useState(true);
  const [includeMortgageReg, setIncludeMortgageReg] = useState(false);
  const [loanAmount, setLoanAmount] = useState(Math.round((priceAed ?? 1500000) * 0.75));

  const { dldFee, agentCommission, mortgageRegFee, total } = useMemo(() => {
    const dldFee = price * DLD_RATE + DLD_ADMIN_FEE;
    const agentCommission = includeAgentCommission ? price * AGENT_COMMISSION_RATE * 1.05 : 0;
    const mortgageRegFee = includeMortgageReg ? loanAmount * MORTGAGE_REG_RATE + MORTGAGE_REG_ADMIN_FEE : 0;
    return { dldFee, agentCommission, mortgageRegFee, total: dldFee + agentCommission + mortgageRegFee };
  }, [price, includeAgentCommission, includeMortgageReg, loanAmount]);

  return (
    <div className="space-y-3">
      <NumberField label="Property Price (AED)" value={price} onChange={setPrice} step={10000} />

      <label className="flex items-center gap-2 text-xs text-ink-300">
        <input
          type="checkbox"
          checked={includeAgentCommission}
          onChange={(e) => setIncludeAgentCommission(e.target.checked)}
          className="accent-gold-500"
        />
        Include typical agent commission (2% + VAT)
      </label>

      <label className="flex items-center gap-2 text-xs text-ink-300">
        <input
          type="checkbox"
          checked={includeMortgageReg}
          onChange={(e) => setIncludeMortgageReg(e.target.checked)}
          className="accent-gold-500"
        />
        Buying with a mortgage
      </label>
      {includeMortgageReg && (
        <NumberField label="Loan Amount (AED)" value={loanAmount} onChange={setLoanAmount} step={5000} />
      )}

      <ResultCard>
        <ResultRow label="DLD Transfer Fee (4% + AED 580)" value={formatAedNumber(dldFee)} />
        {includeAgentCommission && <ResultRow label="Agent Commission (2% + VAT)" value={formatAedNumber(agentCommission)} />}
        {includeMortgageReg && (
          <ResultRow label="Mortgage Registration Fee (0.25% + AED 290)" value={formatAedNumber(mortgageRegFee)} />
        )}
        <ResultRow label="Total Transaction Fees" value={formatAedNumber(total)} highlight />
      </ResultCard>
      <p className="text-[11px] text-ink-500">
        Standard published DLD rates as of 2026 — confirm with your conveyancer for exact figures.
      </p>
    </div>
  );
}
