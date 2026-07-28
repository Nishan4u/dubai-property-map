"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swift: string;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-navy-800 py-1.5 text-xs last:border-b-0">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-100">{value}</span>
    </div>
  );
}

export function BankTransferPayment({
  accountType,
  accountId,
  planKey,
  planLabel,
  bankDetails,
  initialReferralCode = "",
}: {
  accountType: "developer" | "broker" | "salesperson" | "broker_agency";
  accountId: string;
  planKey: string;
  planLabel: string;
  bankDetails: BankDetails;
  initialReferralCode?: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please attach a payment receipt.");
      return;
    }
    setStatus("submitting");
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      setStatus("error");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${accountId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    setUploadPercent(0);
    const { promise } = uploadFileWithProgress("payment-receipts", path, file, setUploadPercent);
    const { error: uploadError } = await promise;
    if (uploadError) {
      setError(uploadError.message);
      setStatus("error");
      return;
    }

    const { data: insertedTransfer, error: insertError } = await supabase
      .from("subscription_bank_transfers")
      .insert({
        account_type: accountType,
        developer_id: accountType === "developer" ? accountId : null,
        broker_id: accountType === "broker" ? accountId : null,
        salesperson_id: accountType === "salesperson" ? accountId : null,
        brokerage_id: accountType === "broker_agency" ? accountId : null,
        plan_key: planKey,
        amount_aed: Number(amount) || 0,
        receipt_url: path,
        transaction_reference: reference.trim() || null,
        transfer_date: transferDate || null,
        note: note.trim() || null,
        referral_code: referralCode.trim() || null,
        submitted_by: user.id,
      })
      .select("id")
      .single();

    if (insertError || !insertedTransfer) {
      setError(insertError?.message ?? "Could not submit payment.");
      setStatus("error");
      return;
    }

    fetch("/api/subscriptions/bank-transfer-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferId: insertedTransfer.id }),
    }).catch(() => {
      // Best-effort — the submission itself is already saved.
    });

    setStatus("submitted");
    router.refresh();
  }

  if (status === "submitted") {
    return (
      <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-gold-300">
        Receipt submitted for <strong>{planLabel}</strong>. Your payment status
        is now <strong>Payment Verification Pending</strong> — an admin will
        review it shortly.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-4">
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-ink-100">
          <Landmark className="h-4 w-4 text-gold-400" /> Bank Transfer Details
        </h4>
        <div className="mt-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2">
          <DetailRow label="Bank Name" value={bankDetails.bankName} />
          <DetailRow label="Account Name" value={bankDetails.accountName} />
          <DetailRow label="Account Number" value={bankDetails.accountNumber} />
          <DetailRow label="IBAN" value={bankDetails.iban} />
          <DetailRow label="SWIFT/BIC" value={bankDetails.swift} />
          {!bankDetails.bankName && (
            <p className="py-1 text-xs text-ink-500">
              Bank details haven&apos;t been configured yet — contact support.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-xs font-medium text-ink-300">
          After completing the transfer for <strong>{planLabel}</strong>, submit
          your receipt below.
        </p>

        {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">
            Payment Receipt (JPG, PNG or PDF)
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            required
            disabled={status === "submitting"}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-ink-300 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-100 hover:file:bg-navy-600"
          />
          {file && status === "submitting" && (
            <div className="mt-2">
              <UploadProgressItem fileName={file.name} fileSize={file.size} state="uploading" percent={uploadPercent} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Transaction / Reference Number
            </label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Transfer Date
            </label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Amount Paid (AED)
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">
            Referral Code (optional)
          </label>
          <input
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Enter a referral code if you have one"
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {status === "submitting" ? "Submitting…" : "Submit Payment Receipt"}
        </button>
      </form>
    </div>
  );
}
