"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Factor } from "@supabase/supabase-js";
import { ShieldCheck, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { parseDeviceLabel } from "@/lib/broker/session";
import { DataTable } from "@/components/ui/DataTable";

interface LoginHistoryRow {
  id: string;
  ip: string | null;
  user_agent: string | null;
  success: boolean;
  created_at: string;
}

interface EnrollState {
  factorId: string;
  qrCode: string;
  secret: string;
}

// Role-agnostic -- mounted as-is across every portal (buyer's Account
// tab, broker's existing /broker/security page, and four new portal
// pages). 2FA is Supabase's own native MFA (auth.mfa.*), not a custom
// TOTP implementation. Login History and Devices both read the new
// login_history table (patch_101) -- "Devices" here means recent devices
// you've logged in FROM plus a real "sign out everywhere else" action
// (auth.signOut({scope})), not granular per-device revoke, which
// Supabase doesn't expose.
export function SecurityPanel({ showDeviceManagement = true }: { showDeviceManagement?: boolean }) {
  const router = useRouter();

  const [factors, setFactors] = useState<Factor[]>([]);
  const [factorsLoading, setFactorsLoading] = useState(true);
  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [enrollError, setEnrollError] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [unenrollingId, setUnenrollingId] = useState("");

  const [history, setHistory] = useState<LoginHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState<"others" | "global" | null>(null);

  async function refreshFactors() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
    setFactorsLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data }) => {
      setFactors(data?.totp ?? []);
      setFactorsLoading(false);
    });
    supabase
      .from("login_history")
      .select("id, ip, user_agent, success, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setHistory((data ?? []) as LoginHistoryRow[]);
        setHistoryLoading(false);
      });
  }, []);

  const devices = useMemo(() => {
    const byKey = new Map<string, { label: string; ip: string | null; lastSeen: string }>();
    for (const row of history) {
      const label = parseDeviceLabel(row.user_agent);
      const key = `${label}|${row.ip ?? ""}`;
      const existing = byKey.get(key);
      if (!existing || new Date(row.created_at) > new Date(existing.lastSeen)) {
        byKey.set(key, { label, ip: row.ip, lastSeen: row.created_at });
      }
    }
    return Array.from(byKey.values()).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }, [history]);

  async function handleStartEnroll() {
    setEnrollError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator App",
      issuer: "Dubai Property Map",
    });
    if (error || !data) {
      setEnrollError(error?.message ?? "Couldn't start enrollment — try again.");
      return;
    }
    setEnroll({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  }

  async function handleCancelEnroll() {
    if (enroll) {
      const supabase = createClient();
      await supabase.auth.mfa.unenroll({ factorId: enroll.factorId }).catch(() => {});
    }
    setEnroll(null);
    setVerifyCode("");
    setVerifyError("");
  }

  async function handleVerifyEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    setVerifyLoading(true);
    setVerifyError("");
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enroll.factorId,
      code: verifyCode,
    });
    if (error) {
      setVerifyError(error.message || "Invalid code — please try again.");
      setVerifyLoading(false);
      return;
    }
    setEnroll(null);
    setVerifyCode("");
    setVerifyLoading(false);
    await refreshFactors();
  }

  async function handleUnenroll(factorId: string) {
    if (!window.confirm("Disable two-factor authentication? You'll only need your password to log in.")) return;
    setUnenrollingId(factorId);
    const supabase = createClient();
    await supabase.auth.mfa.unenroll({ factorId });
    await refreshFactors();
    setUnenrollingId("");
  }

  async function handleSignOutOthers() {
    setSignOutLoading("others");
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "others" });
    setSignOutLoading(null);
  }

  async function handleSignOutEverywhere() {
    if (!window.confirm("Sign out of every device, including this one? You'll need to log in again.")) return;
    setSignOutLoading("global");
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold-400" />
          <p className="text-sm font-semibold text-ink-100">Two-Factor Authentication</p>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Require a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password, etc.) at login.
        </p>

        {!factorsLoading && factors.length > 0 && !enroll && (
          <div className="mt-4 space-y-2">
            {factors.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg bg-navy-800 px-3 py-2.5">
                <div>
                  <p className="text-sm text-ink-100">{f.friendly_name || "Authenticator App"}</p>
                  <p className="text-[11px] text-ink-500">Enabled {new Date(f.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleUnenroll(f.id)}
                  disabled={unenrollingId === f.id}
                  className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-60"
                >
                  {unenrollingId === f.id ? "Disabling…" : "Disable"}
                </button>
              </div>
            ))}
          </div>
        )}

        {!factorsLoading && factors.length === 0 && !enroll && (
          <button
            onClick={handleStartEnroll}
            className="mt-4 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
          >
            Enable 2FA
          </button>
        )}
        {enrollError && <p className="mt-2 text-xs font-medium text-rose-400">{enrollError}</p>}

        {enroll && (
          <div className="mt-4 space-y-4 rounded-lg border border-navy-700 bg-navy-900 p-4">
            <p className="text-xs text-ink-400">
              Scan this QR code with your authenticator app, or enter the secret manually.
            </p>
            <div className="flex flex-wrap items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/svg+xml;utf-8,${encodeURIComponent(enroll.qrCode)}`}
                alt="2FA QR code"
                className="h-36 w-36 shrink-0 rounded-lg bg-white p-2"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[11px] text-ink-500">Manual entry secret</p>
                <p className="break-all rounded-lg bg-navy-800 px-2 py-1.5 font-mono text-xs text-ink-200">
                  {enroll.secret}
                </p>
              </div>
            </div>
            <form onSubmit={handleVerifyEnroll} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">Enter the 6-digit code</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-32 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-center text-sm tracking-[0.3em] text-ink-100 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={verifyLoading || verifyCode.length !== 6}
                className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
              >
                {verifyLoading ? "Verifying…" : "Verify & Enable"}
              </button>
              <button
                type="button"
                onClick={handleCancelEnroll}
                className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
              >
                Cancel
              </button>
            </form>
            {verifyError && <p className="text-xs font-medium text-rose-400">{verifyError}</p>}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
        <p className="text-sm font-semibold text-ink-100">Login History</p>
        <p className="mt-1 text-xs text-ink-500">Your most recent successful logins.</p>
        <div className="mt-4">
          {historyLoading ? (
            <p className="text-xs text-ink-500">Loading…</p>
          ) : (
            <DataTable<LoginHistoryRow>
              columns={[
                { header: "Date", render: (r) => new Date(r.created_at).toLocaleString() },
                { header: "Device", render: (r) => parseDeviceLabel(r.user_agent) },
                { header: "IP Address", render: (r) => r.ip ?? "—" },
                {
                  header: "Status",
                  render: (r) => (
                    <span className={r.success ? "text-emerald-400" : "text-rose-400"}>
                      {r.success ? "Success" : "Failed"}
                    </span>
                  ),
                },
              ]}
              rows={history}
            />
          )}
        </div>
      </div>

      {showDeviceManagement && (
        <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-gold-400" />
            <p className="text-sm font-semibold text-ink-100">Devices</p>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            Devices you&apos;ve recently logged in from. This isn&apos;t live session tracking — it&apos;s built from
            your login history above.
          </p>
          <div className="mt-4 space-y-2">
            {devices.length === 0 && !historyLoading && <p className="text-xs text-ink-500">No history yet.</p>}
            {devices.map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-navy-800 px-3 py-2.5 text-xs">
                <span className="text-ink-100">{d.label}</span>
                <span className="text-ink-500">
                  {d.ip ?? "—"} · Last seen {new Date(d.lastSeen).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleSignOutOthers}
              disabled={signOutLoading !== null}
              className="rounded-lg border border-navy-600 px-4 py-2 text-xs font-medium text-ink-300 hover:text-ink-100 disabled:opacity-60"
            >
              {signOutLoading === "others" ? "Signing out…" : "Sign Out of All Other Devices"}
            </button>
            <button
              onClick={handleSignOutEverywhere}
              disabled={signOutLoading !== null}
              className="rounded-lg border border-rose-600/40 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-60"
            >
              {signOutLoading === "global" ? "Signing out…" : "Sign Out Everywhere"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
