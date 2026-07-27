"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function DeviceConflictClient() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "otp">("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const res = await fetch("/api/broker/session/logout-other/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const res = await fetch("/api/broker/session/logout-other/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    router.push("/broker");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-850 p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-center text-lg font-semibold text-ink-100">Account Already Active</h1>
        <p className="mt-2 text-center text-sm text-ink-400">
          Your Dubai Property Map account is currently logged in on another device. Log out from your
          current device before logging in here, or verify it&apos;s you below to log it out remotely.
        </p>

        {step === "intro" ? (
          <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Password</label>
              <PasswordInput
                required
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
              />
            </div>

            {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {loading ? "Sending code…" : "Logout Other Device"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <p className="text-xs text-ink-400">
              Enter the 6-digit code we emailed to {email}. It expires in 10 minutes.
            </p>
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-center text-lg tracking-[0.4em] text-ink-100 placeholder:tracking-normal placeholder:text-ink-500 focus:outline-none"
            />

            {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify & Log In Here"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
