"use client";

import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";
import type { DeveloperAwardRow, DeveloperRow } from "@/types/database";

export function DeveloperProfileForm({
  developer,
  awards: initialAwards,
}: {
  developer: DeveloperRow;
  awards: DeveloperAwardRow[];
}) {
  const [name, setName] = useState(developer.name);
  const [email, setEmail] = useState(developer.email ?? "");
  const [phone, setPhone] = useState(developer.phone ?? "");
  const [website, setWebsite] = useState(developer.website ?? "");
  const [description, setDescription] = useState(developer.description ?? "");
  const [logoUrl, setLogoUrl] = useState(developer.logo_url ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPercent, setLogoPercent] = useState(0);
  const [logoError, setLogoError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const [awards, setAwards] = useState(initialAwards);
  const [awardTitle, setAwardTitle] = useState("");
  const [awardYear, setAwardYear] = useState("");
  const [awardIssuer, setAwardIssuer] = useState("");
  const [awardStatus, setAwardStatus] = useState<"idle" | "saving">("idle");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("developers")
      .update({ name, email, phone, website, description })
      .eq("id", developer.id);
    setStatus(error ? "error" : "saved");
    if (!error) setTimeout(() => setStatus("idle"), 2000);
  }

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
    await supabase
      .from("developers")
      .update({ logo_url: data.publicUrl })
      .eq("id", developer.id);

    setLogoUrl(data.publicUrl);
    setLogoFile(null);
  }

  async function handleAddAward(e: React.FormEvent) {
    e.preventDefault();
    if (!awardTitle.trim()) return;
    setAwardStatus("saving");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("developer_awards")
      .insert({
        developer_id: developer.id,
        title: awardTitle.trim(),
        year: awardYear ? Number(awardYear) : null,
        issuer: awardIssuer.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setAwards((prev) => [data, ...prev]);
      setAwardTitle("");
      setAwardYear("");
      setAwardIssuer("");
    }
    setAwardStatus("idle");
  }

  async function handleDeleteAward(id: string) {
    setAwards((prev) => prev.filter((a) => a.id !== id));
    const supabase = createClient();
    await supabase.from("developer_awards").delete().eq("id", id);
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-5">
        <p className="text-sm font-semibold text-ink-100">Company Logo</p>
        <p className="text-xs text-ink-500">
          Shown on your developer page and in the &quot;Our Partner
          Developers&quot; slider on the homepage.
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

      <form onSubmit={handleSave} className="max-w-2xl space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company Name" value={name} onChange={setName} />
          <Field label="Contact Email" value={email} onChange={setEmail} type="email" />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Website" value={website} onChange={setWebsite} placeholder="https://…" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">About</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved!" : "Save Changes"}
        </button>
        {status === "error" && (
          <p className="text-xs font-medium text-rose-400">
            Something went wrong — please try again.
          </p>
        )}
      </form>

      <div className="max-w-2xl space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
        <p className="text-sm font-semibold text-ink-100">Awards</p>
        <ul className="space-y-2">
          {awards.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm"
            >
              <div>
                <p className="text-ink-100">{a.title}</p>
                <p className="text-xs text-ink-500">
                  {[a.issuer, a.year].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                onClick={() => handleDeleteAward(a.id)}
                className="text-ink-500 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {awards.length === 0 && (
            <p className="text-xs text-ink-500">No awards added yet.</p>
          )}
        </ul>

        <form onSubmit={handleAddAward} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            required
            placeholder="Award title"
            value={awardTitle}
            onChange={(e) => setAwardTitle(e.target.value)}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none sm:col-span-1"
          />
          <input
            placeholder="Issuer (optional)"
            value={awardIssuer}
            onChange={(e) => setAwardIssuer(e.target.value)}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              placeholder="Year"
              type="number"
              value={awardYear}
              onChange={(e) => setAwardYear(e.target.value)}
              className="w-24 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={awardStatus === "saving"}
              className="flex-1 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </form>
      </div>
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
