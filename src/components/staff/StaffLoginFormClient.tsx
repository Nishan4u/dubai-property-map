"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function StaffLoginFormClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role, staff_id").eq("id", data.user.id).single();
    if (profile?.role !== "staff" || !profile.staff_id) {
      await supabase.auth.signOut();
      setErrorMsg("This login is for Dubai Property Map staff accounts only.");
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/staff");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-navy-700 bg-navy-850 p-8">
        <h1 className="text-xl font-bold text-ink-100">Staff Login</h1>
        <p className="mt-1 text-sm text-ink-400">Dubai Property Map internal staff access.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
