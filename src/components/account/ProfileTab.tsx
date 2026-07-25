"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileTab({ userId }: { userId: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [{ data: profile }, { data: userRes }] = await Promise.all([
        supabase.from("profiles").select("full_name, role").eq("id", userId).single(),
        supabase.auth.getUser(),
      ]);
      setFullName(profile?.full_name ?? "");
      setRole(profile?.role ?? "");
      setEmail(userRes.user?.email ?? "");
      setLoading(false);
    }
    load();
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);
    setStatus(error ? "error" : "saved");
    if (!error) setTimeout(() => setStatus("idle"), 2000);
  }

  if (loading) {
    return <p className="p-6 text-sm text-ink-500">Loading profile…</p>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-md space-y-4 p-6">
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">
          Full Name
        </label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">
          Email
        </label>
        <input
          disabled
          value={email}
          className="w-full rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-ink-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">
          Account Type
        </label>
        <p className="text-sm capitalize text-ink-200">{role}</p>
      </div>
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved!" : "Save Changes"}
      </button>
      {status === "error" && (
        <p className="text-xs font-medium text-rose-400">
          Something went wrong — please try again.
        </p>
      )}
    </form>
  );
}
