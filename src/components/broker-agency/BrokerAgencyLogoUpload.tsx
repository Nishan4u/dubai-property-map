"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";

// Mirrors BrokerProfileForm.tsx's photo upload section exactly (same
// storage bucket/path convention, same upload-with-progress helper) --
// scoped to just the logo since the rest of the agency profile page is
// deliberately read-only and editing those fields wasn't asked for.
export function BrokerAgencyLogoUpload({ brokerageId, name, logoUrl }: { brokerageId: string; name: string; logoUrl: string | null }) {
  const router = useRouter();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [percent, setPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleUpload() {
    if (!logoFile) return;
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();
    const safeName = logoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `brokerage-logos/${brokerageId}/${Date.now()}-${safeName}`;
    const { promise } = uploadFileWithProgress("project-media", path, logoFile, setPercent);
    const { error: uploadError } = await promise;
    if (uploadError) {
      setErrorMsg(uploadError.message);
      setLoading(false);
      return;
    }

    const newLogoUrl = supabase.storage.from("project-media").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("brokerages").update({ logo_url: newLogoUrl }).eq("id", brokerageId);
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setLogoFile(null);
    setLoading(false);
    router.refresh();
  }

  const previewSrc = logoFile ? URL.createObjectURL(logoFile) : logoUrl;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-navy-700 bg-navy-850 p-4">
      {previewSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewSrc} alt={name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xl font-semibold text-navy-950">
          {name.charAt(0)}
        </span>
      )}

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100">
            Choose Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {logoFile && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {loading ? "Uploading…" : "Save"}
            </button>
          )}
        </div>
        {logoFile && loading && (
          <UploadProgressItem fileName={logoFile.name} fileSize={logoFile.size} state="uploading" percent={percent} />
        )}
        {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}
      </div>
    </div>
  );
}
