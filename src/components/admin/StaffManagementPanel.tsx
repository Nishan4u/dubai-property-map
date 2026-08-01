"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { CompactSelect } from "@/components/public/CompactSelect";

const COMMISSION_TYPE_OPTIONS = [
  { label: "Percentage", value: "percentage" },
  { label: "Flat (AED)", value: "flat" },
];

interface StaffRow {
  id: string;
  status: "active" | "inactive" | "archived";
  login_enabled: boolean;
  commission_type: "percentage" | "flat";
  commission_rate: number;
  new_subscription_target: number;
  renewal_target: number;
  revenue_target: number;
}

const statusTone: Record<string, "green" | "gold" | "neutral"> = {
  active: "green",
  inactive: "gold",
  archived: "neutral",
};

export function StaffManagementPanel({ staff }: { staff: StaffRow }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [commissionType, setCommissionType] = useState(staff.commission_type);
  const [commissionRate, setCommissionRate] = useState(String(staff.commission_rate));
  const now = new Date();
  const [targetYear, setTargetYear] = useState(now.getUTCFullYear());
  const [targetMonth, setTargetMonth] = useState(now.getUTCMonth() + 1);
  const [newSubscriptionTarget, setNewSubscriptionTarget] = useState(String(staff.new_subscription_target));
  const [renewalTarget, setRenewalTarget] = useState(String(staff.renewal_target));
  const [revenueTarget, setRevenueTarget] = useState(String(staff.revenue_target));
  const [newPassword, setNewPassword] = useState("");

  async function runAction(action: string, body: Record<string, unknown> = {}) {
    setLoading(true);
    setMsg("");
    const res = await fetch(`/api/admin/staff/${staff.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Something went wrong.");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-navy-700 bg-navy-850 p-5 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink-100">Account</p>
          <Badge tone={statusTone[staff.status]}>{staff.status}</Badge>
          {!staff.login_enabled && <Badge tone="neutral">Login Disabled</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          {staff.status !== "active" && (
            <button disabled={loading} onClick={() => runAction("set_status", { status: "active" })} className="rounded-lg border border-emerald-600/40 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50">
              Activate
            </button>
          )}
          {staff.status !== "inactive" && (
            <button disabled={loading} onClick={() => runAction("set_status", { status: "inactive" })} className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100 disabled:opacity-50">
              Deactivate
            </button>
          )}
          {staff.status !== "archived" && (
            <button disabled={loading} onClick={() => { if (window.confirm("Archive this staff member?")) runAction("set_status", { status: "archived" }); }} className="rounded-lg border border-rose-600/40 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-50">
              Archive
            </button>
          )}
          <button
            disabled={loading}
            onClick={() => runAction("set_login_enabled", { enabled: !staff.login_enabled })}
            className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100 disabled:opacity-50"
          >
            {staff.login_enabled ? "Disable Login" : "Enable Login"}
          </button>
        </div>
        <div className="flex items-end gap-2 border-t border-navy-800 pt-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-ink-400">Reset Password</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (6+ chars)"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <button
            disabled={loading || newPassword.length < 6}
            onClick={async () => {
              if (await runAction("reset_password", { password: newPassword })) setNewPassword("");
            }}
            className="rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-3 border-t border-navy-800 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <p className="text-sm font-semibold text-ink-100">Commission</p>
        <div className="flex items-end gap-2">
          <CompactSelect
            label="Commission type"
            hideLabel
            allowClear={false}
            searchable={false}
            placeholder="Commission type"
            value={commissionType}
            onChange={(v) => setCommissionType(v as "percentage" | "flat")}
            options={COMMISSION_TYPE_OPTIONS}
            className="w-36"
          />
          <input type="number" step="0.01" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="w-28 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none" />
          <button disabled={loading} onClick={() => runAction("set_commission", { commissionType, commissionRate })} className="rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-50">
            Save
          </button>
        </div>

        <p className="pt-2 text-sm font-semibold text-ink-100">Monthly Target</p>
        <div className="flex items-end gap-2">
          <input type="number" min={1} max={12} value={targetMonth} onChange={(e) => setTargetMonth(Number(e.target.value))} className="w-16 rounded-lg border border-navy-600 bg-navy-800 px-2 py-2 text-sm text-ink-100 focus:outline-none" title="Month" />
          <input type="number" value={targetYear} onChange={(e) => setTargetYear(Number(e.target.value))} className="w-20 rounded-lg border border-navy-600 bg-navy-800 px-2 py-2 text-sm text-ink-100 focus:outline-none" title="Year" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">New Subs</label>
            <input type="number" value={newSubscriptionTarget} onChange={(e) => setNewSubscriptionTarget(e.target.value)} className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2 py-2 text-sm text-ink-100 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Renewals</label>
            <input type="number" value={renewalTarget} onChange={(e) => setRenewalTarget(e.target.value)} className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2 py-2 text-sm text-ink-100 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Revenue (AED)</label>
            <input type="number" value={revenueTarget} onChange={(e) => setRevenueTarget(e.target.value)} className="w-full rounded-lg border border-navy-600 bg-navy-800 px-2 py-2 text-sm text-ink-100 focus:outline-none" />
          </div>
        </div>
        <button
          disabled={loading}
          onClick={() => runAction("set_target", { year: targetYear, month: targetMonth, newSubscriptionTarget, renewalTarget, revenueTarget })}
          className="rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-50"
        >
          Save Target
        </button>
      </div>

      {msg && <p className="text-xs font-medium text-rose-400 lg:col-span-2">{msg}</p>}
    </div>
  );
}
