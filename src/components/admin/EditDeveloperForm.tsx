"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";
import type { DeveloperRow } from "@/types/database";

export function EditDeveloperForm({ developer }: { developer: DeveloperRow }) {
  const router = useRouter();
  const [name, setName] = useState(developer.name);
  const [email, setEmail] = useState(developer.email ?? "");
  const [phone, setPhone] = useState(developer.phone ?? "");
  const [website, setWebsite] = useState(developer.website ?? "");
  const [founded, setFounded] = useState(developer.founded?.toString() ?? "");
  const [description, setDescription] = useState(developer.description ?? "");
  const [approvedEmailDomain, setApprovedEmailDomain] = useState(developer.approved_email_domain ?? "");
  const [logoUrl, setLogoUrl] = useState(developer.logo_url ?? "");
  const [featured, setFeatured] = useState(developer.featured);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPercent, setLogoPercent] = useState(0);
  const [logoError, setLogoError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoFile(file);
    setLogoPercent(0);
    setLogoError("");

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `developer-logos/${developer.id}/${Date.now()}-${safeName}`;
    const { promise } = uploadFileWithProgress("project-media", path, file, setLogoPercent);
    const { error: uploadError } = await promise;

    if (uploadError) {
      setLogoError(uploadError.message);
      setLogoFile(null);
      return;
    }

    const { data } = supabase.storage.from("project-media").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("developers")
      .update({ logo_url: data.publicUrl })
      .eq("id", developer.id);

    if (updateError) {
      setLogoError(updateError.message);
      setLogoFile(null);
      return;
    }

    await logAudit("developer.logo_updated", "developer", developer.id, { name });
    setLogoUrl(data.publicUrl);
    setLogoFile(null);
    router.refresh();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("developers")
      .update({
        name,
        email: email || null,
        phone: phone || null,
        website: website || null,
        founded: founded ? Number(founded) : null,
        description: description || null,
        approved_email_domain: approvedEmailDomain.trim() ? approvedEmailDomain.trim().replace(/^@/, "").toLowerCase() : null,
        featured,
      })
      .eq("id", developer.id);

    if (error) {
      setStatus("error");
      return;
    }
    await logAudit("developer.edited", "developer", developer.id, { name });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-5">
        <p className="text-sm font-semibold text-ink-100">Company Logo</p>
        <p className="text-xs text-ink-500">
          Shown on the developer&apos;s page and in the homepage &quot;Our
          Partner Developers&quot; slider.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-navy-600 bg-navy-900">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} className="h-full w-full object-contain p-2" />
            ) : (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ background: developer.color }}
              >
                {developer.initial}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 px-4 py-2.5 text-sm text-ink-300 hover:border-gold-500/40 hover:text-ink-100">
              <Upload className="h-4 w-4" />
              {logoFile ? "Uploading…" : logoUrl ? "Replace Logo" : "Upload Logo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                disabled={!!logoFile}
                onChange={handleLogoUpload}
              />
            </label>
            {logoFile && (
              <div className="mt-2 max-w-xs">
                <UploadProgressItem
                  fileName={logoFile.name}
                  fileSize={logoFile.size}
                  state={logoError ? "error" : "uploading"}
                  percent={logoPercent}
                  errorMessage={logoError}
                  onRemove={logoError ? () => setLogoFile(null) : undefined}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 gap-4 rounded-xl border border-navy-700 bg-navy-850 p-5 sm:grid-cols-2"
      >
      <Field label="Company Name" value={name} onChange={setName} />
      <Field label="Contact Email" value={email} onChange={setEmail} type="email" />
      <Field label="Phone" value={phone} onChange={setPhone} />
      <Field label="Website" value={website} onChange={setWebsite} placeholder="https://…" />
      <Field label="Founded (year)" value={founded} onChange={setFounded} type="number" />
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Salesperson Email Domain</label>
        <input
          value={approvedEmailDomain}
          onChange={(e) => setApprovedEmailDomain(e.target.value)}
          placeholder="e.g. damac.com"
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-ink-500">
          Required for salespeople to self-register under this developer — their work email must end in this domain.
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-ink-400">About</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-xs text-ink-300">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="accent-gold-500"
          />
          Featured developer — shown first in the partner developers strip and the Developers directory
        </label>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved!" : "Save Changes"}
        </button>
        {status === "error" && (
          <p className="text-xs font-medium text-rose-400">Something went wrong — try again.</p>
        )}
      </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
    </div>
  );
}
