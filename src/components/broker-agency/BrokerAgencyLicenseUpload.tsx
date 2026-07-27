"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";

export function BrokerAgencyLicenseUpload({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [percent, setPercent] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!licenseFile) {
      setErrorMsg("Please upload your agency license to continue.");
      return;
    }
    setUploading(true);
    setErrorMsg("");
    setPercent(0);

    const supabase = createClient();
    const safeName = licenseFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${agencyId}/license/${Date.now()}-${safeName}`;
    const { promise } = uploadFileWithProgress("broker-documents", path, licenseFile, setPercent);
    const { error } = await promise;

    if (error) {
      setErrorMsg(error.message);
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase.from("brokerages").update({ license_path: path }).eq("id", agencyId);
    setUploading(false);
    if (updateError) {
      setErrorMsg(updateError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-850 p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
          <Building className="h-6 w-6" />
        </div>
        <h1 className="text-center text-lg font-semibold text-ink-100">Upload your agency license</h1>
        <p className="mt-2 text-center text-sm text-ink-400">
          One more step before your agency dashboard is ready.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Agency License <span className="text-rose-400">*</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 bg-navy-800 px-3 py-3 text-sm text-ink-300 hover:border-gold-500/60">
              <Upload className="h-4 w-4 shrink-0 text-ink-500" />
              <span className="truncate">{licenseFile?.name ?? "Upload your license (image or PDF)"}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="mt-1 text-[11px] text-ink-500">Kept private — visible only to you and platform admins.</p>
          </div>

          {uploading && licenseFile && (
            <UploadProgressItem fileName={licenseFile.name} fileSize={licenseFile.size} state="uploading" percent={percent} />
          )}

          {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {uploading ? "Submitting…" : "Submit for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
