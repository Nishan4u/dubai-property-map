"use client";

import { useEffect, useState } from "react";
import { SignatureCapture, type SignatureValue } from "@/components/contracts/SignatureCapture";

interface ReservationView {
  status: string;
  contractHtml: string | null;
  buyerName: string | null;
  projectName: string | null;
  signedAt: string | null;
}

export function SignContractClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reservation, setReservation] = useState<ReservationView | null>(null);
  const [signature, setSignature] = useState<SignatureValue | null>(null);
  const [signedByName, setSignedByName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`/api/reservations/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "This reservation link isn't valid.");
          setLoading(false);
          return;
        }
        setReservation(data);
        setSignedByName(data.buyerName ?? "");
        setLoading(false);
      })
      .catch(() => {
        setError("Something went wrong loading this reservation.");
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signature || !signedByName.trim()) return;
    setSubmitting(true);
    setSubmitError("");

    const res = await fetch(`/api/reservations/${token}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signatureType: signature.signatureType,
        signatureData: signature.signatureData,
        signedByName: signedByName.trim(),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmitError(data.error ?? "Failed to sign — please try again.");
      setSubmitting(false);
      return;
    }

    setReservation((prev) => (prev ? { ...prev, status: "signed", signedAt: new Date().toISOString() } : prev));
    setSubmitting(false);
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-6 py-20 text-center text-sm text-ink-400">Loading…</div>;
  }

  if (error || !reservation) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="rounded-2xl border border-rose-700/40 bg-navy-850 p-8">
          <h1 className="text-lg font-semibold text-rose-400">Link not available</h1>
          <p className="mt-2 text-sm text-ink-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-xl border border-navy-700 bg-white">
        <iframe title="Reservation Agreement" srcDoc={reservation.contractHtml ?? ""} className="h-[600px] w-full" />
      </div>

      {reservation.status === "signed" ? (
        <div className="mt-6 rounded-xl border border-emerald-600/40 bg-emerald-500/10 p-6 text-center">
          <p className="text-sm font-semibold text-emerald-300">This agreement has been signed.</p>
          {reservation.signedAt && (
            <p className="mt-1 text-xs text-ink-400">Signed on {new Date(reservation.signedAt).toLocaleString()}</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
          <h2 className="text-sm font-semibold text-ink-100">Sign this agreement</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Full Name</label>
            <input
              required
              value={signedByName}
              onChange={(e) => setSignedByName(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <SignatureCapture signedByName={signedByName} onChange={setSignature} />
          {submitError && <p className="text-xs font-medium text-rose-400">{submitError}</p>}
          <button
            type="submit"
            disabled={submitting || !signature || !signedByName.trim()}
            className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {submitting ? "Signing…" : "Sign Agreement"}
          </button>
        </form>
      )}
    </div>
  );
}
