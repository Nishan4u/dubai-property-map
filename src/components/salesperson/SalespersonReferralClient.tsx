"use client";

import { useEffect, useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import { generateReferralQrCode } from "@/lib/referralQrCode";

interface WalletTransaction {
  id: string;
  type: string;
  amount_aed: number;
  note: string | null;
  created_at: string;
}

// Mirrors src/components/broker/BrokerReferralClient.tsx -- see it for
// context. Kept as its own copy rather than a shared component since
// broker/salesperson portals are otherwise fully separate component trees
// in this codebase.
export function SalespersonReferralClient({
  referralCode,
  totalReferrals,
  successfulReferrals,
  pendingReferrals,
  wallet,
  history,
}: {
  referralCode: string | null;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  wallet: { balance_aed: number; total_earned_aed: number; total_used_aed: number; pending_aed: number };
  history: WalletTransaction[];
}) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
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
  const encodedText = encodeURIComponent(`Join Dubai Property Map using my referral code ${referralCode}`);
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
        <p className="text-sm font-semibold text-ink-200">Referral Wallet</p>
        <p className="mt-1 text-2xl font-bold text-gold-400">AED {Number(wallet.balance_aed).toLocaleString()}</p>
        <p className="mt-1 text-xs text-ink-500">
          Earned AED {Number(wallet.total_earned_aed).toLocaleString()} · Used AED {Number(wallet.total_used_aed).toLocaleString()}
          {Number(wallet.pending_aed) > 0 && <> · AED {Number(wallet.pending_aed).toLocaleString()} pending</>}
        </p>
        <p className="mt-2 text-xs text-ink-500">Use this balance toward your subscription renewal from the Subscription page.</p>
      </div>

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
