"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus } from "lucide-react";
import { CompactSelect } from "@/components/public/CompactSelect";

const COMMISSION_TYPE_OPTIONS = [
  { label: "Percentage", value: "percentage" },
  { label: "Flat Amount (AED)", value: "flat" },
];

interface CreatedStaff {
  fullName: string;
  email: string;
  password: string;
  referralCode: string;
}

export function CreateStaffForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [commissionType, setCommissionType] = useState<"percentage" | "flat">("percentage");
  const [commissionRate, setCommissionRate] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [created, setCreated] = useState<CreatedStaff | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/admin/staff/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone, position, password, referralCode, commissionType, commissionRate }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong.");
      return;
    }

    setCreated({ fullName, email, password, referralCode: data.staff.referral_code });
    setFullName("");
    setEmail("");
    setPhone("");
    setPosition("");
    setPassword("");
    setReferralCode("");
    setCommissionRate("");
    setOpen(false);
    setStatus("idle");
    router.refresh();
  }

  async function handleCopy() {
    if (!created) return;
    await navigator.clipboard.writeText(
      `Staff: ${created.fullName}\nEmail: ${created.email}\nPassword: ${created.password}\nReferral Code: ${created.referralCode}\nLogin: ${window.location.origin}/staff/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> Add Staff
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Full Name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Position/Role</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Sales Consultant" className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971…" className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Login Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Password</label>
            <input required minLength={6} type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Referral Code (optional)</label>
            <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Auto-generated if blank" className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none" />
          </div>
          <div>
            <CompactSelect
              label="Commission Type"
              allowClear={false}
              searchable={false}
              placeholder="Commission Type"
              value={commissionType}
              onChange={(v) => setCommissionType(v as "percentage" | "flat")}
              options={COMMISSION_TYPE_OPTIONS}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Commission {commissionType === "flat" ? "Amount (AED)" : "Rate (%)"}
            </label>
            <input type="number" step="0.01" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none" />
          </div>

          {status === "error" && <p className="text-xs font-medium text-rose-400 sm:col-span-3">{errorMsg}</p>}

          <button type="submit" disabled={status === "saving"} className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 sm:col-span-3">
            {status === "saving" ? "Creating…" : "Create Staff Account"}
          </button>
        </form>
      )}

      {created && (
        <div className="space-y-2 rounded-xl border border-emerald-600/40 bg-emerald-500/10 p-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-emerald-300">{created.fullName} — account created</p>
              <p className="mt-1 text-ink-300">
                Email: <span className="font-medium text-ink-100">{created.email}</span>
                {" · "}Password: <span className="font-mono font-medium text-ink-100">{created.password}</span>
                {" · "}Referral Code: <span className="font-mono font-medium text-gold-400">{created.referralCode}</span>
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Privately share these credentials and the login path (/staff/login) — the password won&apos;t be shown again.
              </p>
            </div>
            <button onClick={handleCopy} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100">
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
