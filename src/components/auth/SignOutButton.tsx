"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Brokers get exactly one active device session — if a plain sign-out
    // didn't also revoke it, logging back in on this same device would
    // falsely look like a device conflict (the old row would still be
    // 'active'). Every "Logout" button in the app renders this same
    // component, so this only fires for actual broker accounts.
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("broker_id")
        .eq("id", user.id)
        .single();
      if (profile?.broker_id) {
        await supabase
          .from("broker_sessions")
          .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_by: user.id })
          .eq("broker_id", profile.broker_id)
          .eq("status", "active");
      }
    }

    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <button
      onClick={handleSignOut}
      className={
        className ??
        "flex items-center gap-2 rounded-lg border border-navy-700 px-3 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
      }
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
