"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

export function DeleteDeveloperButton({
  developerId,
  developerName,
  redirectTo,
}: {
  developerId: string;
  developerName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${developerName}"? This removes the developer, all of their projects, and any ad placements. This cannot be undone.`
      )
    ) {
      return;
    }
    setLoading(true);
    const supabase = createClient();
    await logAudit("developer.deleted", "developer", developerId, { name: developerName });
    await supabase.from("developers").delete().eq("id", developerId);
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
