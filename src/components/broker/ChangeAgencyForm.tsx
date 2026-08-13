"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";
import { CompactSelect } from "@/components/public/CompactSelect";

interface AgencyOption {
  id: string;
  name: string;
}

export function ChangeAgencyForm({
  agencies,
  currentBrokerageId,
  hasLicenseOnFile,
}: {
  agencies: AgencyOption[];
  currentBrokerageId: string | null;
  hasLicenseOnFile: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePercent, setLicensePercent] = useState(0);
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [licenseOnFile, setLicenseOnFile] = useState(hasLicenseOnFile);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("loading");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.rpc("change_broker_agency", { p_new_brokerage_id: selected });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("idle");
    setSelected("");
    router.refresh();
  }

  async function handleLicenseUpload(file: File) {
    setLicenseUploading(true);
    setLicensePercent(0);
    setErrorMsg("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("broker_id").eq("id", user!.id).single();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${profile!.broker_id}/license/${Date.now()}-${safeName}`;
    const { promise } = uploadFileWithProgress("broker-documents", path, file, setLicensePercent);
    const { error } = await promise;
    if (error) {
      setErrorMsg(error.message);
      setLicenseUploading(false);
      return;
    }
    await supabase.from("brokers").update({ license_path: path }).eq("id", profile!.broker_id);
    setLicenseUploading(false);
    setLicenseOnFile(true);
    router.refresh();
  }

  async function handleBecomeIndependent() {
    if (!window.confirm("Become an independent broker? You'll be disconnected from your current agency, but your account, subscription and history stay intact.")) {
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.rpc("change_broker_agency", { p_new_brokerage_id: null });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("idle");
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
      <form onSubmit={handleConnect}>
        <label className="mb-1 block text-xs font-medium text-ink-400">
          {currentBrokerageId ? "Change Agency" : "Connect to an Agency"}
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <CompactSelect
              label={currentBrokerageId ? "Change Agency" : "Connect to an Agency"}
              placeholder="Select an agency…"
              hideLabel
              value={selected}
              onChange={setSelected}
              options={agencies.filter((a) => a.id !== currentBrokerageId).map((a) => ({ label: a.name, value: a.id }))}
            />
          </div>
          <button
            type="submit"
            disabled={!selected || status === "loading"}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-50"
          >
            {status === "loading" ? "Connecting…" : "Connect"}
          </button>
        </div>
      </form>

      {currentBrokerageId && (
        <div className="border-t border-navy-700 pt-3">
          <p className="mb-2 text-xs font-medium text-ink-400">Become Independent</p>
          {!licenseOnFile ? (
            <>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 bg-navy-800 px-3 py-3 text-sm text-ink-300 hover:border-gold-500/60">
                <Upload className="h-4 w-4 shrink-0 text-ink-500" />
                <span className="truncate">{licenseFile?.name ?? "Upload your broker license first (required)"}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={licenseUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLicenseFile(file);
                      handleLicenseUpload(file);
                    }
                  }}
                />
              </label>
              {licenseUploading && licenseFile && (
                <div className="mt-2">
                  <UploadProgressItem fileName={licenseFile.name} fileSize={licenseFile.size} state="uploading" percent={licensePercent} />
                </div>
              )}
            </>
          ) : (
            <button
              onClick={handleBecomeIndependent}
              disabled={status === "loading"}
              className="rounded-lg border border-rose-600/40 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
            >
              {status === "loading" ? "Processing…" : "Become Independent"}
            </button>
          )}
        </div>
      )}

      {status === "error" && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}
    </div>
  );
}
