"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ConfirmCard({
  status,
}: {
  status: "working" | "error";
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-navy-700 bg-navy-850 p-8 text-center">
        {status === "working" ? (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
            <p className="text-sm text-ink-300">Confirming your account…</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-ink-100">
              Confirmation link expired or invalid
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              Please try registering again, or log in if you&apos;ve already
              confirmed.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"working" | "error">("working");

  useEffect(() => {
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/";

    async function confirm() {
      // Newer-style Supabase templates put token_hash/type in the query string.
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

  return <ConfirmCard status={status} />;
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<ConfirmCard status="working" />}>
      <ConfirmInner />
    </Suspense>
  );
}
