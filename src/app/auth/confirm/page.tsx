"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResendForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return (
      <p className="mt-4 text-xs font-medium text-emerald-300">
        If an unconfirmed account exists for {email}, a new confirmation
        email is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={handleResend} className="mt-4 space-y-2 text-left">
      <label className="block text-xs font-medium text-ink-400">
        Get a new confirmation link
      </label>
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-gold-500 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Resend confirmation email"}
      </button>
      {status === "error" && (
        <p className="text-xs font-medium text-rose-400">
          Something went wrong — please try again shortly.
        </p>
      )}
    </form>
  );
}

function ConfirmCard({
  status,
  onConfirmClick,
}: {
  status: "working" | "error" | "verified" | "confirm";
  onConfirmClick?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-navy-700 bg-navy-850 p-8 text-center">
        {status === "working" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
            <p className="text-sm text-ink-300">Confirming your account…</p>
          </>
        )}
        {status === "confirm" && (
          <>
            <h1 className="text-lg font-semibold text-ink-100">Confirm your email</h1>
            <p className="mt-2 text-sm text-ink-400">
              Click below to finish confirming this email address.
            </p>
            <button
              onClick={onConfirmClick}
              className="mt-4 w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400"
            >
              Confirm email address
            </button>
          </>
        )}
        {status === "verified" && (
          <>
            <h1 className="text-lg font-semibold text-ink-100">Email confirmed</h1>
            <p className="mt-2 text-sm text-ink-400">
              Your email address is verified. You can now log in — including
              from a different browser or device than the one you registered
              on.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400"
            >
              Go to login
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-lg font-semibold text-ink-100">
              Confirmation link expired or invalid
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              This can happen if the link was already used, or if your mail
              app opened it automatically before you clicked it. Request a
              fresh one below, or{" "}
              <Link href="/login" className="text-gold-400 hover:underline">
                log in
              </Link>{" "}
              if you&apos;ve already confirmed.
            </p>
            <ResendForm />
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"working" | "error" | "verified" | "confirm">("working");
  const token = searchParams.get("token");

  async function handleConfirmClick() {
    setStatus("working");
    try {
      const res = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setStatus(res.ok ? "verified" : "error");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/";

    async function confirm() {
      // Our own signup-confirmation flow (see /api/auth/verify-email) --
      // Supabase's built-in confirmation email depends on their outbound
      // SMTP, which is broken at the platform level, so account creation
      // and confirmation now go through a self-issued token instead.
      // Requires an explicit button click (handleConfirmClick) rather than
      // firing automatically here -- an email security scanner prefetching
      // this page would otherwise burn the one-time token before the real
      // recipient ever sees it.
      if (token) {
        setStatus("confirm");
        return;
      }
      if (searchParams.get("verify_error")) {
        setStatus("error");
        return;
      }

      // Password recovery still goes through Supabase's native flow --
      // newer-style templates put token_hash/type in the query string.
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type: type as "email" | "signup" | "recovery" | "invite",
          token_hash: tokenHash,
        });
        // Conclusive either way — do NOT fall through to the "any session
        // already exists" check below. A user who happens to already be
        // logged in (e.g. clicking a stale/invalid recovery link while
        // signed in elsewhere) would otherwise have that unrelated session
        // mistaken for proof this token succeeded, silently admitting them
        // to /reset-password on an invalid or expired link.
        setStatus(error ? "error" : "working");
        if (!error) router.replace(next);
        return;
      }

      // Default Supabase templates redirect with the session in the URL
      // fragment (#access_token=...), which the browser SDK auto-detects
      // on load. Give it a moment, then check if a session appeared.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace(next);
        return;
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_IN" && session) {
            router.replace(next);
          }
        }
      );

      setTimeout(() => {
        authListener.subscription.unsubscribe();
        setStatus((s) => (s === "working" ? "error" : s));
      }, 4000);
    }

    confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ConfirmCard status={status} onConfirmClick={handleConfirmClick} />;
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<ConfirmCard status="working" />}>
      <ConfirmInner />
    </Suspense>
  );
}
