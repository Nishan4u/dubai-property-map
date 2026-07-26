"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const kindLabel: Record<string, string> = {
  team_member: "team member",
  developer_salesperson: "salesperson",
  admin_salesperson: "salesperson",
  admin_member: "admin",
};

function AcceptInner() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ready" | "invalid" | "submitting" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [invite, setInvite] = useState<{ kind: string; email: string; developerName: string | null } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMsg("Missing invitation link.");
      return;
    }
    fetch(`/api/invitations/by-token/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "This invitation link is invalid.");
        setInvite(data);
        setStatus("ready");
      })
      .catch((e) => {
        setStatus("invalid");
        setErrorMsg(e instanceof Error ? e.message : "This invitation link is invalid.");
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setStatus("error");
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMsg("Passwords don't match.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    const res = await fetch(`/api/invitations/by-token/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong.");
      return;
    }
    setStatus("done");
    setTimeout(() => router.push("/login?invited=success"), 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-navy-700 bg-navy-850 p-8">
        {status === "loading" && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
            <p className="text-sm text-ink-300">Checking your invitation…</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="text-center">
            <h1 className="text-lg font-semibold text-ink-100">Invitation link invalid</h1>
            <p className="mt-2 text-sm text-ink-400">{errorMsg}</p>
          </div>
        )}

        {status === "done" && (
          <div className="text-center">
            <h1 className="text-lg font-semibold text-emerald-300">Account activated</h1>
            <p className="mt-2 text-sm text-ink-400">Redirecting you to login…</p>
          </div>
        )}

        {(status === "ready" || status === "submitting" || (status === "error" && invite)) && invite && (
          <>
            <h1 className="text-xl font-bold text-ink-100">Accept your invitation</h1>
            <p className="mt-1 text-sm text-ink-400">
              You've been invited{invite.developerName ? ` by ${invite.developerName}` : ""} as a{" "}
              {kindLabel[invite.kind] ?? "member"}. Set a password for{" "}
              <span className="font-medium text-ink-200">{invite.email}</span> to activate your account.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">Password</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">Confirm Password</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
                />
              </div>
              {status === "error" && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
              >
                {status === "submitting" ? "Activating…" : "Activate Account"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-navy-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
        </div>
      }
    >
      <AcceptInner />
    </Suspense>
  );
}
