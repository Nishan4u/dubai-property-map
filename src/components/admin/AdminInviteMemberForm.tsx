"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function AdminInviteMemberForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resultMsg, setResultMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");
    setResultMsg(null);

    const res = await fetch("/api/admin/members/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong.");
      return;
    }

    setResultMsg(
      data.invitation.status === "sent"
        ? { ok: true, text: `Invitation sent to ${email}.` }
        : { ok: false, text: `Invitation created for ${email}, but the email failed to send — see Email Logs to retry.` }
    );
    setFullName("");
    setEmail("");
    setOpen(false);
    setStatus("idle");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-100">Admin Team</h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Full Name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {status === "saving" ? "Sending…" : "Send Invitation"}
          </button>
          {status === "error" && <p className="w-full text-xs font-medium text-rose-400">{errorMsg}</p>}
        </form>
      )}
      {resultMsg && (
        <p className={`text-xs font-medium ${resultMsg.ok ? "text-emerald-400" : "text-rose-400"}`}>{resultMsg.text}</p>
      )}
    </div>
  );
}
