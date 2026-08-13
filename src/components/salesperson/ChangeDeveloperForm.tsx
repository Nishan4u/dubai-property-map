"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CompactSelect } from "@/components/public/CompactSelect";

interface DeveloperOption {
  id: string;
  name: string;
}

export function ChangeDeveloperForm({
  developers,
  currentDeveloperId,
}: {
  developers: DeveloperOption[];
  currentDeveloperId: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.rpc("change_salesperson_developer", { p_new_developer_id: selected });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("idle");
    setSelected("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <label className="mb-1 block text-xs font-medium text-ink-400">
        {currentDeveloperId ? "Change Developer" : "Select the developer you work for"}
      </label>
      <div className="flex gap-2">
        <CompactSelect
          label="Developer"
          hideLabel
          placeholder="Select a developer…"
          value={selected}
          onChange={setSelected}
          className="flex-1"
          options={developers
            .filter((d) => d.id !== currentDeveloperId)
            .map((d) => ({ label: d.name, value: d.id }))}
        />
        <button
          type="submit"
          disabled={!selected || status === "loading"}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-50"
        >
          {status === "loading" ? "Connecting…" : "Connect"}
        </button>
      </div>
      {status === "error" && <p className="mt-2 text-xs font-medium text-rose-400">{errorMsg}</p>}
    </form>
  );
}
