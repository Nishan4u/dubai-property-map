"use client";

import { useState } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import type { DbBrokerVerificationStatus } from "@/types/database";

const statusCopy: Record<DbBrokerVerificationStatus, { title: string; tone: string; body: string }> = {
  none: { title: "Not Verified", tone: "text-ink-400", body: "Stand out with a Verified Broker badge, priority placement on the Brokers directory, and priority search results." },
  pending_payment: { title: "Verification Pending", tone: "text-gold-400", body: "Your payment is being processed." },
  active: { title: "Verified Broker", tone: "text-emerald-400", body: "Your badge is active." },
  rejected: { title: "Verification Rejected", tone: "text-rose-400", body: "Your last verification request wasn't approved. You can try again." },
  revoked: { title: "Verification Revoked", tone: "text-rose-400", body: "Your Verified Broker badge was revoked. Contact support for details." },
  expired: { title: "Verification Expired", tone: "text-gold-400", body: "Renew to keep your Verified Broker badge." },
};

export function BrokerVerificationCard({
  verificationStatus,
  verificationExpiresAt,
  feeAed,
}: {
  verificationStatus: DbBrokerVerificationStatus;
  verificationExpiresAt: string | null;
  feeAed: number;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const copy = statusCopy[verificationStatus] ?? statusCopy.none;
  const isActive = verificationStatus === "active" && (!verificationExpiresAt || new Date(verificationExpiresAt) > new Date());

  async function handleCheckout() {
    setLoading(true);
    setErrorMsg("");
    const res = await fetch("/api/broker/verification-checkout", { method: "POST" });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
      return;
    }
    setErrorMsg(json.error ?? "Something went wrong.");
    setLoading(false);
  }

  return (
    <div className="max-w-md rounded-xl border border-navy-700 bg-navy-850 p-6">
      <div className="flex items-center gap-2">
        {isActive ? <BadgeCheck className="h-5 w-5 text-sky-400" /> : <ShieldCheck className="h-5 w-5 text-ink-500" />}
        <h2 className={`text-sm font-semibold ${copy.tone}`}>{copy.title}</h2>
      </div>
      <p className="mt-1 text-xs text-ink-400">{copy.body}</p>
      {isActive && verificationExpiresAt && (
        <p className="mt-2 text-xs text-ink-500">Valid until {new Date(verificationExpiresAt).toLocaleDateString()}</p>
      )}
      {!isActive && (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="mt-4 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          {loading ? "Redirecting…" : `Get Verified — AED ${feeAed}/year`}
        </button>
      )}
      {errorMsg && <p className="mt-2 text-xs font-medium text-rose-400">{errorMsg}</p>}
    </div>
  );
}
