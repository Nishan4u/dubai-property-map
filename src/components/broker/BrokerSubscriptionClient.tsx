"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Check, Gift, Landmark, Wallet, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BankTransferPayment, type BankDetails } from "@/components/dashboard/BankTransferPayment";
import { BankTransferHistory } from "@/components/dashboard/BankTransferHistory";
import { isExpiringSoon } from "@/lib/subscriptionStatus";
import { getReferralCookie } from "@/lib/referralCookie";
import { PromoPrice } from "@/components/ui/PromoPrice";
import type { SubscriptionBankTransferRow } from "@/types/database";

interface Plan {
  key: string;
  name: string;
  price_label: string;
  price_aed?: number | null;
  vat_percent?: number | null;
  features: string[];
  online_payment_enabled?: boolean;
  bank_transfer_enabled?: boolean;
  promo_active?: boolean;
  promo_ends_at?: string | null;
  promo_price_label?: string | null;
}

interface PendingDiscount {
  percent: number;
  eligiblePlanKeys: string[] | null;
}

interface AppliedDiscount {
  percent: number;
  amountAed: number | null;
}

export function BrokerSubscriptionClient({
  plans,
  currentPlanKey,
  subscriptionStatus,
  subscriptionExpiresAt,
  hasStripeCustomer,
  brokerId,
  bankDetails,
  bankTransfers,
  walletBalance,
  walletNewPurchaseEnabled,
  pendingDiscount,
  appliedDiscount,
}: {
  plans: Plan[];
  currentPlanKey: string | null;
  subscriptionStatus: string;
  subscriptionExpiresAt?: string | null;
  hasStripeCustomer: boolean;
  brokerId: string;
  bankDetails: BankDetails;
  bankTransfers: SubscriptionBankTransferRow[];
  walletBalance: number;
  walletNewPurchaseEnabled: boolean;
  pendingDiscount: PendingDiscount | null;
  appliedDiscount: AppliedDiscount | null;
}) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");
  const [bankTransferPlan, setBankTransferPlan] = useState<Plan | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [walletPayingPlan, setWalletPayingPlan] = useState<string | null>(null);
  const [networkLoadingPlan, setNetworkLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    // document.cookie doesn't exist during SSR -- must read it after mount.
    const cookieCode = getReferralCookie();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cookieCode) setReferralCode(cookieCode);
  }, []);

  async function handleWalletPay(plan: string) {
    setWalletPayingPlan(plan);
    setError("");
    try {
      const res = await fetch("/api/broker/wallet/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Wallet payment failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet payment failed");
      setWalletPayingPlan(null);
    }
  }

  async function handleSubscribe(plan: string) {
    setLoadingPlan(plan);
    setError("");
    try {
      const res = await fetch("/api/broker/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, referralCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoadingPlan(null);
    }
  }

  async function handleNetworkCheckout(plan: string) {
    setNetworkLoadingPlan(plan);
    setError("");
    try {
      const res = await fetch("/api/broker/network-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, referralCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setNetworkLoadingPlan(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setError("");
    try {
      const res = await fetch("/api/broker/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not open billing portal");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPortalLoading(false);
    }
  }

  const isActive = subscriptionStatus === "active";

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-rose-600/40 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300">
          {error}
        </p>
      )}

      <div className="max-w-xs">
        <label className="mb-1 block text-xs font-medium text-ink-400">Referral Code (Optional)</label>
        <input
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="Enter a referral code if you have one"
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
      </div>

      {pendingDiscount && (
        <p className="flex max-w-lg items-center gap-2 rounded-lg border border-gold-500/40 bg-gold-500/10 px-4 py-2 text-xs font-medium text-gold-300">
          <Gift className="h-4 w-4 shrink-0" />
          You have a referral discount available — {pendingDiscount.percent}% off your first subscription.
        </p>
      )}

      <BankTransferHistory transfers={bankTransfers} />

      {isActive && (
        <div className="flex max-w-lg items-center justify-between rounded-xl border border-navy-700 bg-navy-850 p-4">
          <div>
            <p className="text-sm font-semibold text-ink-100">Current subscription</p>
            <div className="flex items-center gap-2">
              {isExpiringSoon(subscriptionStatus, subscriptionExpiresAt) && (
                <Badge tone="gold">Expiring Soon</Badge>
              )}
              <Badge tone="green">Active</Badge>
            </div>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={portalLoading || !hasStripeCustomer}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {portalLoading ? "Opening…" : "Manage Billing"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentPlanKey && isActive;
          const discountApplies =
            !!pendingDiscount &&
            (!pendingDiscount.eligiblePlanKeys || pendingDiscount.eligiblePlanKeys.includes(plan.key));
          const isRenewalPlan = plan.key === currentPlanKey;
          // price_aed already includes VAT (not collected as a separate
          // line item from subscribers) -- this backs the VAT portion out
          // of that inclusive price for display only, it isn't added on top.
          const vatAmount =
            plan.price_aed != null && plan.vat_percent
              ? plan.price_aed - plan.price_aed / (1 + plan.vat_percent / 100)
              : null;
          const canPayWithWallet =
            plan.price_aed != null &&
            walletBalance >= plan.price_aed &&
            (isRenewalPlan || walletNewPurchaseEnabled) &&
            !isCurrent;
          return (
            <div
              key={plan.key}
              className={clsx(
                "rounded-xl border p-5",
                isCurrent ? "border-gold-500 bg-gold-500/5" : "border-navy-700 bg-navy-850"
              )}
            >
              <h3 className="text-sm font-semibold text-ink-100">{plan.name}</h3>
              <PromoPrice plan={plan} />
              {discountApplies && plan.price_aed != null && (
                <p className="mt-1 text-xs font-medium text-gold-400">
                  Referral price: AED {(plan.price_aed * (1 - pendingDiscount!.percent / 100)).toFixed(2)} (
                  {pendingDiscount!.percent}% off)
                </p>
              )}
              {!!plan.vat_percent && vatAmount != null && (
                <p className="mt-1 text-xs text-ink-500">
                  Includes {plan.vat_percent}% VAT (AED {vatAmount.toFixed(2)})
                </p>
              )}
              {isCurrent && appliedDiscount && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-gold-400">
                  <Gift className="h-3.5 w-3.5 shrink-0" />
                  Referral discount applied: {appliedDiscount.percent}% off
                  {appliedDiscount.amountAed != null && ` (saved AED ${appliedDiscount.amountAed.toFixed(2)})`}
                </p>
              )}
              <ul className="mt-4 space-y-2 text-xs text-ink-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> {f}
                  </li>
                ))}
              </ul>
              {plan.online_payment_enabled !== false && (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={isCurrent || loadingPlan !== null}
                  className={clsx(
                    "mt-5 w-full rounded-lg py-2 text-sm font-semibold",
                    isCurrent
                      ? "bg-navy-700 text-ink-400"
                      : "bg-gold-500 text-navy-950 hover:bg-gold-400 disabled:opacity-60"
                  )}
                >
                  {isCurrent ? "Current Plan" : loadingPlan === plan.key ? "Redirecting…" : "Subscribe"}
                </button>
              )}
              {!isCurrent && plan.bank_transfer_enabled !== false && (
                <button
                  onClick={() =>
                    setBankTransferPlan((cur) => (cur?.key === plan.key ? null : plan))
                  }
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-navy-600 py-2 text-xs font-medium text-ink-300 hover:text-ink-100"
                >
                  <Landmark className="h-3.5 w-3.5" />
                  {bankTransferPlan?.key === plan.key ? "Hide Bank Transfer" : "Pay via Bank Transfer"}
                </button>
              )}
              {!isCurrent && plan.price_aed != null && plan.online_payment_enabled !== false && (
                <button
                  onClick={() => handleNetworkCheckout(plan.key)}
                  disabled={networkLoadingPlan !== null}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-navy-600 py-2 text-xs font-medium text-ink-300 hover:text-ink-100 disabled:opacity-60"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {networkLoadingPlan === plan.key ? "Redirecting…" : "Pay with Network International"}
                </button>
              )}
              {canPayWithWallet && (
                <button
                  onClick={() => handleWalletPay(plan.key)}
                  disabled={walletPayingPlan !== null}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 py-2 text-xs font-medium text-gold-300 hover:bg-gold-500/20 disabled:opacity-60"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {walletPayingPlan === plan.key ? "Processing…" : `Pay with Wallet (AED ${plan.price_aed!.toFixed(2)})`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {bankTransferPlan && (
        <BankTransferPayment
          accountType="broker"
          accountId={brokerId}
          planKey={bankTransferPlan.key}
          planLabel={bankTransferPlan.name}
          bankDetails={bankDetails}
          initialReferralCode={referralCode}
        />
      )}
    </div>
  );
}
