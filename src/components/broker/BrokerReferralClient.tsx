"use client";

import { useEffect, useState } from "react";
import { Copy, Check, QrCode, Banknote } from "lucide-react";
import { clsx } from "clsx";
import { generateReferralQrCode } from "@/lib/referralQrCode";
import { Badge } from "@/components/ui/Badge";

interface WalletTransaction {
  id: string;
  type: string;
  amount_aed: number;
  note: string | null;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  amount_aed: number;
  bank_name: string;
  bank_iban: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const withdrawalStatusTone = { pending: "gold", paid: "green", rejected: "red" } as const;

export function BrokerReferralClient({
  referralCode,
  discountPercent,
  totalReferrals,
  successfulReferrals,
  pendingReferrals,
  wallet,
  history,
  withdrawalRequests,
}: {
  referralCode: string | null;
  discountPercent: number | null;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  wallet: { balance_aed: number; total_earned_aed: number; total_used_aed: number; pending_aed: number };
  history: WalletTransaction[];
  withdrawalRequests: WithdrawalRequest[];
}) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  const pendingWithdrawalTotal = withdrawalRequests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.amount_aed), 0);
  const availableToWithdraw = Number(wallet.balance_aed) - pendingWithdrawalTotal;

  async function handleRequestWithdrawal() {
    setWithdrawError("");
    const amount = Number(withdrawAmount);
    if (!(amount > 0)) {
      setWithdrawError("Enter a valid amount.");
      return;
    }
    if (amount > availableToWithdraw) {
      setWithdrawError(`You can withdraw up to AED ${availableToWithdraw.toFixed(2)}.`);
      return;
    }
    if (!bankAccountName.trim() || !bankName.trim() || !bankIban.trim()) {
      setWithdrawError("Bank account name, bank name, and IBAN/account number are all required.");
      return;
    }

    setWithdrawSubmitting(true);
    try {
      const res = await fetch("/api/broker/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountAed: amount, bankAccountName, bankName, bankIban }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit withdrawal request.");
      window.location.reload();
    } catch (e) {
      setWithdrawError(e instanceof Error ? e.message : "Could not submit withdrawal request.");
      setWithdrawSubmitting(false);
    }
  }

  useEffect(() => {
    // window.location.origin doesn't exist during SSR -- computing this
    // during render (even via a lazy useState initializer) would mismatch
    // between the server-rendered HTML and the client's first render, so
    // it has to be set after mount instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (referralCode) setShareUrl(`${window.location.origin}/register?ref=${referralCode}`);
  }, [referralCode]);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleToggleQr() {
    if (!showQr && !qrDataUrl && shareUrl) {
      const dataUrl = await generateReferralQrCode(shareUrl);
      setQrDataUrl(dataUrl);
    }
    setShowQr((v) => !v);
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const shareText =
    discountPercent != null
      ? `Join Dubai Property Map using my referral code ${referralCode} and get ${discountPercent}% off your first subscription!`
      : `Join Dubai Property Map using my referral code ${referralCode}`;
  const encodedText = encodeURIComponent(shareText);
  const shareLinks = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
  ];

  if (!referralCode) {
    return <p className="text-sm text-ink-500">Your referral code hasn&apos;t been generated yet — check back shortly.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <p className="text-xs font-medium text-ink-500">My Referral Code</p>
        <p className="mt-1 text-2xl font-bold tracking-wide text-gold-400">{referralCode}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
          {shareLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-navy-600 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
            >
              {l.label}
            </a>
          ))}
          <a
            href={`mailto:?subject=${encodeURIComponent("Join Dubai Property Map")}&body=${encodedText}%20${encodedUrl}`}
            className="rounded-lg border border-navy-600 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            Email
          </a>
          <a
            href={`sms:?body=${encodedText}%20${encodedUrl}`}
            className="rounded-lg border border-navy-600 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            SMS
          </a>
          <button
            onClick={handleToggleQr}
            className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            <QrCode className="h-4 w-4" /> {showQr ? "Hide QR Code" : "Show QR Code"}
          </button>
        </div>
        {showQr && (
          <div className="mt-3 flex justify-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR code for your referral link" className="h-44 w-44 rounded-lg" />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-xs text-ink-500">Generating…</div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs font-medium text-ink-500">Total Referrals</p>
          <p className="mt-1 text-xl font-bold text-ink-100">{totalReferrals}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs font-medium text-ink-500">Successful</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{successfulReferrals}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs font-medium text-ink-500">Pending</p>
          <p className="mt-1 text-xl font-bold text-ink-300">{pendingReferrals}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="text-xs font-medium text-ink-500">Total Cashback Earned</p>
          <p className="mt-1 text-xl font-bold text-gold-400">AED {Number(wallet.total_earned_aed).toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-200">Referral Wallet</p>
            <p className="mt-1 text-2xl font-bold text-gold-400">AED {Number(wallet.balance_aed).toLocaleString()}</p>
            <p className="mt-1 text-xs text-ink-500">
              Earned AED {Number(wallet.total_earned_aed).toLocaleString()} · Used AED {Number(wallet.total_used_aed).toLocaleString()}
              {Number(wallet.pending_aed) > 0 && <> · AED {Number(wallet.pending_aed).toLocaleString()} pending</>}
              {pendingWithdrawalTotal > 0 && <> · AED {pendingWithdrawalTotal.toLocaleString()} pending withdrawal</>}
            </p>
          </div>
          {availableToWithdraw > 0 && (
            <button
              onClick={() => setShowWithdrawForm((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-sm font-medium text-gold-300 hover:bg-gold-500/20"
            >
              <Banknote className="h-4 w-4" /> {showWithdrawForm ? "Cancel" : "Withdraw"}
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-500">
          Use this balance toward your subscription renewal from the Subscription page, or withdraw it to your bank account below.
        </p>

        {showWithdrawForm && (
          <div className="mt-4 space-y-3 border-t border-navy-700 pt-4">
            <p className="text-xs text-ink-500">
              Available to withdraw: <span className="font-semibold text-gold-400">AED {availableToWithdraw.toFixed(2)}</span>. An
              admin will review and pay this out via bank transfer.
            </p>
            {withdrawError && (
              <p className="rounded-lg border border-rose-600/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
                {withdrawError}
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">Amount (AED)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">Account Holder Name</label>
                <input
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">Bank Name</label>
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">IBAN / Account Number</label>
                <input
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleRequestWithdrawal}
              disabled={withdrawSubmitting}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {withdrawSubmitting ? "Submitting…" : "Submit Withdrawal Request"}
            </button>
          </div>
        )}
      </div>

      {withdrawalRequests.length > 0 && (
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
          <p className="mb-3 text-sm font-semibold text-ink-200">Withdrawal Requests</p>
          <div className="space-y-1.5">
            {withdrawalRequests.map((r) => (
              <div key={r.id} className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-ink-200">
                      AED {Number(r.amount_aed).toLocaleString()} to {r.bank_name}
                    </p>
                    <p className="text-xs text-ink-500">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge tone={withdrawalStatusTone[r.status as keyof typeof withdrawalStatusTone] ?? "neutral"}>
                    {r.status}
                  </Badge>
                </div>
                {r.status === "rejected" && r.rejection_reason && (
                  <p className={clsx("mt-1 text-xs text-rose-400")}>{r.rejection_reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <p className="mb-3 text-sm font-semibold text-ink-200">Cashback History</p>
        {history.length === 0 ? (
          <p className="text-sm text-ink-500">No wallet activity yet.</p>
        ) : (
          <div className="space-y-1.5">
            {history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm">
                <div>
                  <p className="capitalize text-ink-200">{tx.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-ink-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <span
                  className={
                    tx.type === "cashback_earned" || tx.type === "admin_adjustment_credit"
                      ? "font-semibold text-emerald-400"
                      : "font-semibold text-rose-400"
                  }
                >
                  {tx.type === "cashback_earned" || tx.type === "admin_adjustment_credit" ? "+" : "-"}AED{" "}
                  {Number(tx.amount_aed).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
