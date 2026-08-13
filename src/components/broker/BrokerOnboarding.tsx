"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";
import { CompactSelect } from "@/components/public/CompactSelect";

interface AgencyOption {
  id: string;
  name: string;
}

export function BrokerOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "documents">("details");
  const [brokerId, setBrokerId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [hasAgency, setHasAgency] = useState<"yes" | "no">("yes");
  const [brokerageId, setBrokerageId] = useState("");
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [brn, setBrn] = useState("");
  const [orn, setOrn] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [reraFile, setReraFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [reraPercent, setReraPercent] = useState(0);
  const [licensePercent, setLicensePercent] = useState(0);
  const [photoPercent, setPhotoPercent] = useState(0);
  const [uploadStage, setUploadStage] = useState<"rera" | "license" | "photo" | null>(null);
  const wasIndependent = brokerageId === "" && step === "documents";

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (hasAgency !== "yes" || agencies.length > 0) return;
    const supabase = createClient();
    supabase
      .from("brokerages")
      .select("id, name")
      .not("company_email", "is", null)
      .order("name")
      .then(({ data }) => setAgencies(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAgency]);

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (hasAgency === "yes" && !brokerageId) {
      setErrorMsg("Please select your broker agency.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setErrorMsg("Your session expired — please log in again.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("claim_broker_profile", {
      p_full_name: fullName,
      p_brn: brn,
      p_orn: orn,
      p_email: user.email,
      p_mobile: mobile,
      p_whatsapp: whatsapp,
      p_brokerage_id: hasAgency === "yes" ? brokerageId : null,
      p_referral_code: (user.user_metadata?.referral_code as string | undefined) ?? null,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setBrokerId(data as string);
    setStep("documents");
    setLoading(false);
  }

  async function handleDocumentsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brokerId) return;
    if (!reraFile) {
      setErrorMsg("Please upload your RERA card to continue.");
      return;
    }
    if (wasIndependent && !licenseFile) {
      setErrorMsg("Please upload your broker license to continue.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();

    setUploadStage("rera");
    setReraPercent(0);
    const safeReraName = reraFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const reraPath = `${brokerId}/rera-card/${Date.now()}-${safeReraName}`;
    const { promise: reraPromise } = uploadFileWithProgress("broker-documents", reraPath, reraFile, setReraPercent);
    const { error: reraError } = await reraPromise;

    if (reraError) {
      setErrorMsg(reraError.message);
      setLoading(false);
      setUploadStage(null);
      return;
    }

    let licensePath: string | null = null;
    if (licenseFile) {
      setUploadStage("license");
      setLicensePercent(0);
      const safeLicenseName = licenseFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      licensePath = `${brokerId}/license/${Date.now()}-${safeLicenseName}`;
      const { promise: licensePromise } = uploadFileWithProgress("broker-documents", licensePath, licenseFile, setLicensePercent);
      const { error: licenseError } = await licensePromise;
      if (licenseError) {
        setErrorMsg(licenseError.message);
        setLoading(false);
        setUploadStage(null);
        return;
      }
    }

    let photoUrl: string | null = null;
    if (photoFile) {
      setUploadStage("photo");
      setPhotoPercent(0);
      const safePhotoName = photoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const photoPath = `broker-photos/${brokerId}/${Date.now()}-${safePhotoName}`;
      const { promise: photoPromise } = uploadFileWithProgress("project-media", photoPath, photoFile, setPhotoPercent);
      const { error: photoError } = await photoPromise;
      if (!photoError) {
        photoUrl = supabase.storage.from("project-media").getPublicUrl(photoPath).data.publicUrl;
      }
    }

    const { error: updateError } = await supabase
      .from("brokers")
      .update({
        rera_card_path: reraPath,
        ...(licensePath ? { license_path: licensePath } : {}),
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      })
      .eq("id", brokerId);

    setUploadStage(null);
    if (updateError) {
      setErrorMsg(updateError.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-850 p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
          <Briefcase className="h-6 w-6" />
        </div>
        <h1 className="text-center text-lg font-semibold text-ink-100">
          Set up your broker profile
        </h1>
        <p className="mt-2 text-center text-sm text-ink-400">
          Tell us about yourself. An admin will review your details
          before your account is approved.
        </p>

        {step === "details" ? (
          <form onSubmit={handleDetailsSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Are you working with a Broker Agency?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHasAgency("yes")}
                  className={`rounded-lg py-2 text-sm font-medium ${hasAgency === "yes" ? "bg-gold-500 text-navy-950" : "border border-navy-600 text-ink-300"}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHasAgency("no")}
                  className={`rounded-lg py-2 text-sm font-medium ${hasAgency === "no" ? "bg-gold-500 text-navy-950" : "border border-navy-600 text-ink-300"}`}
                >
                  No — Independent
                </button>
              </div>
            </div>

            {hasAgency === "yes" ? (
              <div>
                <CompactSelect
                  label="Select Broker Agency"
                  placeholder="Select your agency…"
                  value={brokerageId}
                  onChange={setBrokerageId}
                  options={agencies.map((a) => ({ label: a.name, value: a.id }))}
                />
              </div>
            ) : (
              <p className="rounded-lg border border-navy-700 bg-navy-800 p-3 text-xs text-ink-400">
                As an independent broker, you&apos;ll need to upload your broker license in the next step for admin review.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">BRN</label>
                <input
                  required
                  value={brn}
                  onChange={(e) => setBrn(e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">ORN / Company RERA No.</label>
                <input
                  required
                  value={orn}
                  onChange={(e) => setOrn(e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">Mobile Number</label>
                <input
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+971…"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">WhatsApp Number</label>
                <input
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+971…"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
                />
              </div>
            </div>

            {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleDocumentsSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                RERA Card <span className="text-rose-400">*</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 bg-navy-800 px-3 py-3 text-sm text-ink-300 hover:border-gold-500/60">
                <Upload className="h-4 w-4 shrink-0 text-ink-500" />
                <span className="truncate">{reraFile?.name ?? "Upload your RERA card (image or PDF)"}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setReraFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="mt-1 text-[11px] text-ink-500">Kept private — visible only to you and platform admins.</p>
            </div>

            {wasIndependent && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Broker License <span className="text-rose-400">*</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 bg-navy-800 px-3 py-3 text-sm text-ink-300 hover:border-gold-500/60">
                  <Upload className="h-4 w-4 shrink-0 text-ink-500" />
                  <span className="truncate">{licenseFile?.name ?? "Upload your broker license (image or PDF)"}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <p className="mt-1 text-[11px] text-ink-500">Required for independent brokers — kept private.</p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Profile Photo (optional)</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 bg-navy-800 px-3 py-3 text-sm text-ink-300 hover:border-gold-500/60">
                <Upload className="h-4 w-4 shrink-0 text-ink-500" />
                <span className="truncate">{photoFile?.name ?? "Upload a profile photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {uploadStage === "rera" && (
              <UploadProgressItem fileName={reraFile!.name} fileSize={reraFile!.size} state="uploading" percent={reraPercent} />
            )}
            {uploadStage === "license" && licenseFile && (
              <UploadProgressItem fileName={licenseFile.name} fileSize={licenseFile.size} state="uploading" percent={licensePercent} />
            )}
            {uploadStage === "photo" && photoFile && (
              <UploadProgressItem fileName={photoFile.name} fileSize={photoFile.size} state="uploading" percent={photoPercent} />
            )}

            {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit for Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
