"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";

interface CreatedSalesperson {
  id: string;
  fullName: string;
  email: string;
  password: string;
}

export function CreateSalespersonForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [created, setCreated] = useState<CreatedSalesperson | null>(null);
  const [copied, setCopied] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPercent, setPhotoPercent] = useState(0);
  const [photoError, setPhotoError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/admin/salespersons/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, jobTitle, employeeId, email, mobile, whatsapp, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Something went wrong.");
      return;
    }

    await logAudit("salesperson.created", "salesperson", data.salesperson.id, { fullName });
    setCreated({ id: data.salesperson.id, fullName, email, password });
    setPhotoUrl("");
    setFullName("");
    setJobTitle("");
    setEmployeeId("");
    setEmail("");
    setMobile("");
    setWhatsapp("");
    setPassword("");
    setOpen(false);
    setStatus("idle");
    router.refresh();
  }

  async function handleCopy() {
    if (!created) return;
    await navigator.clipboard.writeText(
      `Salesperson: ${created.fullName}\nEmail: ${created.email}\nPassword: ${created.password}\nLogin: ${window.location.origin}/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !created) return;
    setPhotoFile(file);
    setPhotoPercent(0);
    setPhotoError("");

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `salesperson-photos/${created.id}/${Date.now()}-${safeName}`;
    const { promise } = uploadFileWithProgress("project-media", path, file, setPhotoPercent);
    const { error: uploadError } = await promise;

    if (uploadError) {
      setPhotoError(uploadError.message);
      setPhotoFile(null);
      return;
    }

    const { data } = supabase.storage.from("project-media").getPublicUrl(path);
    await supabase.from("salespersons").update({ photo_url: data.publicUrl }).eq("id", created.id);

    setPhotoUrl(data.publicUrl);
    setPhotoFile(null);
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
          Add Salesperson
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4 sm:grid-cols-3"
        >
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
              placeholder="e.g. Sales Executive"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
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
          <div className="sm:col-span-3">
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
              <p className="font-semibold text-emerald-300">{created.fullName} — account created</p>
              <p className="mt-1 text-ink-300">
                Email: <span className="font-medium text-ink-100">{created.email}</span>
                {" · "}Password: <span className="font-mono font-medium text-ink-100">{created.password}</span>
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Share these credentials with the salesperson — this password won&apos;t be shown again.
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
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={created.fullName} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-navy-950">
                  {created.fullName.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 px-4 py-2 text-xs font-medium text-ink-300 hover:border-gold-500/40 hover:text-ink-100">
                <Upload className="h-3.5 w-3.5" />
                {photoFile ? "Uploading…" : photoUrl ? "Replace Photo" : "Add Photo Now"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={!!photoFile}
                  onChange={handlePhotoUpload}
                />
              </label>
              {photoFile && (
                <div className="mt-2 max-w-xs">
                  <UploadProgressItem
                    fileName={photoFile.name}
                    fileSize={photoFile.size}
                    state={photoError ? "error" : "uploading"}
                    percent={photoPercent}
                    errorMessage={photoError}
                    onRemove={photoError ? () => setPhotoFile(null) : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
