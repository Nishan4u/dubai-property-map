"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Copy, Plus, Upload } from "lucide-react";
import { logAudit } from "@/lib/auditLog";

interface CreatedDeveloper {
  id: string;
  name: string;
  email: string;
  password: string;
  initial: string;
  color: string;
}

export function CreateDeveloperForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [created, setCreated] = useState<CreatedDeveloper | null>(null);
  const [copied, setCopied] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/admin/developers/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong.");
      return;
    }

    await logAudit("developer.created_by_admin", "developer", data.developer.id, { name });
    setCreated({
      id: data.developer.id,
      name,
      email,
      password,
      initial: data.developer.initial,
      color: data.developer.color,
    });
    setLogoUrl("");
    setName("");
    setEmail("");
    setPassword("");
    setOpen(false);
    setStatus("idle");
    router.refresh();
  }

  async function handleCopy() {
    if (!created) return;
    await navigator.clipboard.writeText(
      `Developer: ${created.name}\nEmail: ${created.email}\nPassword: ${created.password}\nLogin: ${window.location.origin}/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !created) return;
    setLogoUploading(true);
    setLogoError("");

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `developer-logos/${created.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(path, file);

    if (uploadError) {
      setLogoError(uploadError.message);
      e.target.value = "";
      setLogoUploading(false);
      return;
    }

    const { data } = supabase.storage.from("project-media").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("developers")
      .update({ logo_url: data.publicUrl })
      .eq("id", created.id);

    if (updateError) {
      setLogoError(updateError.message);
      e.target.value = "";
      setLogoUploading(false);
      return;
    }

    await logAudit("developer.logo_updated", "developer", created.id, { name: created.name });
    setLogoUrl(data.publicUrl);
    e.target.value = "";
    setLogoUploading(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" />
          Create Developer Account
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4 sm:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Developer / Company Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skyline Developments"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Login Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@developer.com"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
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

          {status === "error" && (
            <p className="text-xs font-medium text-rose-400 sm:col-span-3">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 sm:col-span-3"
          >
            {status === "saving" ? "Creating…" : "Create Account — active immediately"}
          </button>
        </form>
      )}

      {created && (
        <div className="space-y-4 rounded-xl border border-emerald-600/40 bg-emerald-500/10 p-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-emerald-300">
                {created.name} — account created
              </p>
              <p className="mt-1 text-ink-300">
                Email: <span className="font-medium text-ink-100">{created.email}</span>
                {" · "}Password:{" "}
                <span className="font-mono font-medium text-ink-100">{created.password}</span>
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Share these credentials with the developer — this password won&apos;t be shown again.
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

          <div className="flex items-center gap-4 border-t border-emerald-600/30 pt-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-navy-600 bg-navy-900">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={created.name} className="h-full w-full object-contain p-2" />
              ) : (
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ background: created.color }}
                >
                  {created.initial}
                </span>
              )}
            </div>
            <div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 px-4 py-2 text-xs font-medium text-ink-300 hover:border-gold-500/40 hover:text-ink-100">
                <Upload className="h-3.5 w-3.5" />
                {logoUploading ? "Uploading…" : logoUrl ? "Replace Logo" : "Add Logo Now"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={logoUploading}
                  onChange={handleLogoUpload}
                />
              </label>
              {logoError && <p className="mt-1 text-xs font-medium text-rose-400">{logoError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
