"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Laptop } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SessionInfo {
  id: string;
  device_label: string;
  ip: string | null;
  created_at: string;
  last_active: string;
}

export function BrokerSecurityClient({ session }: { session: SessionInfo | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogoutDevice() {
    if (!session) return;
    if (!window.confirm("Log out this device? You'll need to log in again.")) return;
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("broker_sessions")
      .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_by: user?.id })
      .eq("id", session.id);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!session) {
    return <p className="text-sm text-ink-400">No active device session found.</p>;
  }

  return (
    <div className="max-w-lg rounded-xl border border-navy-700 bg-navy-850 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
          <Laptop className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-100">{session.device_label}</p>
          <p className="text-xs text-ink-500">
            Logged in {new Date(session.created_at).toLocaleString()} · Last active{" "}
            {new Date(session.last_active).toLocaleString()}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-500">
        Dubai Property Map allows one active device per broker account. Use "Logout Device" if you're
        switching devices, or the recovery flow on the login page if you've lost access to this one.
      </p>
      <button
        onClick={handleLogoutDevice}
        disabled={loading}
        className="mt-4 rounded-lg border border-rose-600/40 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-60"
      >
        {loading ? "Logging out…" : "Logout Device"}
      </button>
    </div>
  );
}
