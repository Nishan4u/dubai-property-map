"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordFormClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });

    setLoading(false);
    // Show the same confirmation regardless of outcome — don't reveal
    // whether an account exists for this email.
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-navy-700 bg-navy-850 p-8">
        <h1 className="text-xl font-bold text-ink-100">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-400">
          Enter the email on your account and we&apos;ll send you a link to reset your password.
        </p>

        {sent ? (
          <p className="mt-6 rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            If an account exists for {email}, we&apos;ve sent a password reset link. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>

            {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-ink-500">
          <Link href="/login" className="text-gold-400 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
