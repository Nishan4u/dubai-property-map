"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

export function BrokerForceLogoutButton({ brokerId }: { brokerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleForceLogout() {
    if (!window.confirm("Force logout this broker's active device? They'll need to log in again.")) return;
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("broker_sessions")
      .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_by: user?.id })
      .eq("broker_id", brokerId)
      .eq("status", "active");
    await logAudit("broker.force_logout", "broker", brokerId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      disabled={loading}
      onClick={handleForceLogout}
      className="text-xs font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50"
    >
      Force Logout
    </button>
  );
}
