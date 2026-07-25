"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

export function SalespersonActions({ salespersonId, status }: { salespersonId: string; status: "active" | "inactive" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    const next = status === "active" ? "inactive" : "active";
    const supabase = createClient();
    await supabase.from("salespersons").update({ status: next }).eq("id", salespersonId);
    await logAudit(`salesperson.${next}`, "salesperson", salespersonId);
    router.refresh();
    setLoading(false);
  }

  async function resetPassword() {
    const newPassword = window.prompt("Enter a new password for this salesperson (6+ characters):");
    if (!newPassword) return;
    setLoading(true);
    const res = await fetch(`/api/admin/salespersons/${salespersonId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not reset password.");
    } else {
      await logAudit("salesperson.password_reset", "salesperson", salespersonId);
      alert("Password reset. Share the new password with the salesperson.");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={loading}
        onClick={toggleStatus}
        className={
          status === "active"
            ? "text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
            : "text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
        }
      >
        {status === "active" ? "Deactivate" : "Reactivate"}
      </button>
      <button
        disabled={loading}
        onClick={resetPassword}
        className="text-xs font-medium text-gold-400 hover:text-gold-300 disabled:opacity-50"
      >
        Reset Password
      </button>
    </div>
  );
}
