"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { CompactSelect } from "@/components/public/CompactSelect";

export function AdminCreateSalespersonForm({ developers }: { developers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [developerId, setDeveloperId] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resultMsg, setResultMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!developerId) {
      setStatus("error");
      setErrorMsg("Choose a developer.");
      return;
    }
    setStatus("saving");
    setErrorMsg("");
    setResultMsg(null);

    const res = await fetch("/api/admin/salespersons/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developerId, fullName, jobTitle, employeeId, email, mobile, whatsapp }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong.");
      return;
    }

    setResultMsg(
      data.invitationStatus === "sent"
        ? { ok: true, text: `Invitation sent to ${email}.` }
        : { ok: false, text: `${fullName} was added, but the invitation email couldn't be sent — use Resend below.` }
    );
    setDeveloperId("");
    setFullName("");
    setJobTitle("");
    setEmployeeId("");
    setEmail("");
    setMobile("");
    setWhatsapp("");
    setOpen(false);
    setStatus("idle");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> Add Salesperson
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <CompactSelect
              label="Developer"
              placeholder="Select developer…"
              value={developerId}
              onChange={setDeveloperId}
              options={developers.map((d) => ({ label: d.name, value: d.id }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Full Name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Job Title</label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Employee ID</label>
            <input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Login Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Mobile</label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+971…"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">WhatsApp</label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+971…"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          {status === "error" && <p className="text-xs font-medium text-rose-400 sm:col-span-3">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 sm:col-span-3"
          >
            {status === "saving" ? "Sending invitation…" : "Send Invitation"}
          </button>
        </form>
      )}
      {resultMsg && (
        <p className={`text-xs font-medium ${resultMsg.ok ? "text-emerald-400" : "text-rose-400"}`}>{resultMsg.text}</p>
      )}
    </div>
  );
}
