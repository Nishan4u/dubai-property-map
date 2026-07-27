"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/authError";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setUnconfirmed(false);
    setResendStatus("idle");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(authErrorMessage(error));
      setUnconfirmed(error.code === "email_not_confirmed");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
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
    else router.push("/");
  }

  async function handleResend() {
    setResendStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setResendStatus(error ? "error" : "sent");
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
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
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
