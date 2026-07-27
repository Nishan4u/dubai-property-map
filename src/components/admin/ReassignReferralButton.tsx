"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReassignReferralButton({
  referralId,
  currentStaffId,
  staffOptions,
}: {
  referralId: string;
  currentStaffId: string;
  staffOptions: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!selected || selected === currentStaffId) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/staff/referrals/${referralId}/reassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newStaffId: selected }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not reassign.");
      setLoading(false);
      return;
    }
    router.refresh();
    setOpen(false);
    setLoading(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-gold-400 hover:text-gold-300">
        Reassign
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-lg border border-navy-600 bg-navy-800 px-2 py-1 text-xs text-ink-100 focus:outline-none"
      >
        <option value="">Select staff…</option>
        {staffOptions
          .filter((s) => s.id !== currentStaffId)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
      </select>
      <button disabled={loading || !selected} onClick={handleSave} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50">
        Save
      </button>
      <button onClick={() => setOpen(false)} className="text-xs font-medium text-ink-400 hover:text-ink-200">
        Cancel
      </button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
