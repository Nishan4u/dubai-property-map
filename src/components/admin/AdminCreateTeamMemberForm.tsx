"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus } from "lucide-react";

interface CreatedTeamMember {
  fullName: string;
  email: string;
  password: string;
}

// Mirrors CreateStaffForm.tsx's exact pattern (auth-user creation via a
// server route, one-time credential reveal) -- creates a new admin
// account, optionally restricted to a custom role's module access. An
// empty role selection creates a full, unrestricted admin -- the exact
// same account this platform has always created for "admin".
export function AdminCreateTeamMemberForm({ roles }: { roles: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [customRoleId, setCustomRoleId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [created, setCreated] = useState<CreatedTeamMember | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/admin/team-members/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, customRoleId: customRoleId || null }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong.");
      return;
    }

    setCreated({ fullName, email, password });
    setFullName("");
    setEmail("");
    setPassword("");
    setCustomRoleId("");
    setOpen(false);
    setStatus("idle");
    router.refresh();
  }

  async function handleCopy() {
    if (!created) return;
    await navigator.clipboard.writeText(
      `Admin Team Member: ${created.fullName}\nEmail: ${created.email}\nPassword: ${created.password}\nLogin: ${window.location.origin}/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
      >
        <Plus className="h-4 w-4" /> Add Admin Team Member
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4 sm:grid-cols-2">
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
            <label className="mb-1 block text-xs font-medium text-ink-400">Password</label>
            <input
              required
              minLength={6}
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Role</label>
            <select
              value={customRoleId}
              onChange={(e) => setCustomRoleId(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            >
              <option value="">Full Admin (unrestricted)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {status === "error" && <p className="text-xs font-medium text-rose-400 sm:col-span-2">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 sm:col-span-2"
          >
            {status === "saving" ? "Creating…" : "Create Admin Account"}
          </button>
        </form>
      )}

      {created && (
        <div className="space-y-2 rounded-xl border border-emerald-600/40 bg-emerald-500/10 p-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-emerald-300">{created.fullName} — account created</p>
              <p className="mt-1 text-ink-300">
                Email: <span className="font-medium text-ink-100">{created.email}</span>
                {" · "}Password: <span className="font-mono font-medium text-ink-100">{created.password}</span>
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Privately share these credentials — the password won&apos;t be shown again.
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
