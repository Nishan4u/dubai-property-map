"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/authError";
import { PasswordInput } from "@/components/ui/PasswordInput";

function formatRetryAfter(seconds: number) {
  if (!seconds || seconds < 60) return "a minute";
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function LoginFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justReset = searchParams.get("reset") === "success";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  // Set once signInWithPassword succeeds but the account has a verified
  // TOTP factor requiring step-up (aal2) -- blocks completeLogin() until
  // the code is verified.
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");

  // Everything that happens after the account is fully authenticated
  // (password alone, or password + verified 2FA code) -- unchanged from
  // before the 2FA step existed, just extracted so both paths share it.
  async function completeLogin(supabase: SupabaseClient, userId: string) {
    fetch("/api/auth/login-history", { method: "POST" }).catch(() => {});

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role === "broker") {
      const claimRes = await fetch("/api/broker/session/claim", { method: "POST" });
      if (claimRes.status === 409) {
        await supabase.auth.signOut();
        router.push("/broker-device-conflict");
        setLoading(false);
        return;
      }
      router.refresh();
      router.push("/broker");
      return;
    }

    router.refresh();
    if (profile?.role === "admin") router.push("/admin");
    else if (profile?.role === "developer") router.push("/dashboard");
    else if (profile?.role === "salesperson") router.push("/salesperson");
    else if (profile?.role === "broker_agency") router.push("/broker-agency");
    else router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setUnconfirmed(false);
    setResendStatus("idle");

    // Blocks even a correct password while locked out -- checked before
    // ever calling signInWithPassword, not just after a failure.
    const lockRes = await fetch("/api/auth/login-lockout-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const lockStatus = await lockRes.json();
    if (lockStatus.locked) {
      setErrorMsg(`Too many failed attempts. Try again in ${formatRetryAfter(lockStatus.retryAfterSeconds)}.`);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.code === "invalid_credentials") {
        const failRes = await fetch("/api/auth/login-failure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const failStatus = await failRes.json();
        setErrorMsg(
          failStatus.locked
            ? `Too many failed attempts. Try again in ${formatRetryAfter(failStatus.retryAfterSeconds)}.`
            : authErrorMessage(error)
        );
      } else {
        setErrorMsg(authErrorMessage(error));
      }
      setUnconfirmed(error.code === "email_not_confirmed");
      setLoading(false);
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factorId = factors?.totp?.[0]?.id;
      if (factorId) {
        setMfaFactorId(factorId);
        setLoading(false);
        return;
      }
    }

    await completeLogin(supabase, data.user.id);
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMfaLoading(true);
    setMfaError("");

    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactorId,
      code: mfaCode,
    });

    if (error) {
      setMfaError(error.message || "Invalid code — please try again.");
      setMfaLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMfaError("Something went wrong — please log in again.");
      setMfaLoading(false);
      return;
    }

    await completeLogin(supabase, user.id);
  }

  async function handleResend() {
    setResendStatus("loading");
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendStatus(res.ok ? "sent" : "error");
  }

  if (mfaFactorId) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-navy-700 bg-navy-850 p-8">
          <h1 className="text-xl font-bold text-ink-100">Two-factor verification</h1>
          <p className="mt-1 text-sm text-ink-400">
            Enter the 6-digit code from your authenticator app.
          </p>
          <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Code</label>
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-center text-lg tracking-[0.4em] text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
            {mfaError && (
              <p className="text-xs font-medium text-rose-400">{mfaError}</p>
            )}
            <button
              type="submit"
              disabled={mfaLoading || mfaCode.length !== 6}
              className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {mfaLoading ? "Verifying…" : "Verify"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-navy-700 bg-navy-850 p-8">
        <h1 className="text-xl font-bold text-ink-100">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-400">
          Log in to manage favorites, saved searches and viewing requests.
        </p>
        {justReset && (
          <p className="mt-4 rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-300">
            Password changed successfully. Please log in with your new password.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-ink-400">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-gold-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput required value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-rose-700/40 bg-rose-500/10 p-3">
              <p className="text-xs font-medium text-rose-400">{errorMsg}</p>
              {unconfirmed && (
                <div className="mt-2">
                  {resendStatus === "sent" ? (
                    <p className="text-xs font-medium text-emerald-300">
                      Confirmation email resent — check {email}.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendStatus === "loading"}
                      className="text-xs font-semibold text-gold-400 hover:underline disabled:opacity-60"
                    >
                      {resendStatus === "loading" ? "Resending…" : "Resend confirmation email"}
                    </button>
                  )}
                  {resendStatus === "error" && (
                    <p className="mt-1 text-xs font-medium text-rose-400">
                      Couldn&apos;t resend — please try again shortly.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-gold-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
