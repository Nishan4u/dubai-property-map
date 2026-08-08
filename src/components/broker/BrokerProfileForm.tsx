"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";
import type { BrokerRow } from "@/types/database";

const languageOptions = ["English", "Arabic", "Hindi", "Urdu", "Russian", "French", "Chinese", "Tagalog"];

export function BrokerProfileForm({ broker }: { broker: BrokerRow }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(broker.full_name);
  const [mobile, setMobile] = useState(broker.mobile);
  const [whatsapp, setWhatsapp] = useState(broker.whatsapp);
  const [bio, setBio] = useState(broker.bio ?? "");
  const [experienceYears, setExperienceYears] = useState(broker.experience_years?.toString() ?? "");
  const [languages, setLanguages] = useState<string[]>(broker.languages ?? []);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPercent, setPhotoPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  function toggleLanguage(l: string) {
    setLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSavedMsg("");

    const supabase = createClient();
    let photoUrl = broker.photo_url;

    if (photoFile) {
      setPhotoPercent(0);
      const safeName = photoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `broker-photos/${broker.id}/${Date.now()}-${safeName}`;
      const { promise } = uploadFileWithProgress("project-media", path, photoFile, setPhotoPercent);
      const { error: uploadError } = await promise;
      if (uploadError) {
        setErrorMsg(uploadError.message);
        setLoading(false);
        return;
      }
      photoUrl = supabase.storage.from("project-media").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase
      .from("brokers")
      .update({
        full_name: fullName,
        mobile,
        whatsapp,
        photo_url: photoUrl,
        bio: bio.trim() || null,
        experience_years: experienceYears ? Number(experienceYears) : null,
        languages,
      })
      .eq("id", broker.id);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setSavedMsg("Profile updated.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
      <div className="flex items-center gap-3">
        {photoUrlPreview(photoFile, broker.photo_url, broker.full_name)}
        <label className="cursor-pointer rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100">
          Change Photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {photoFile && loading && (
        <UploadProgressItem
          fileName={photoFile.name}
          fileSize={photoFile.size}
          state="uploading"
          percent={photoPercent}
        />
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Full Name</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Mobile Number</label>
        <input
          required
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">WhatsApp Number</label>
        <input
          required
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Biography</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Tell buyers and investors about yourself…"
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Years of Experience</label>
        <input
          type="number"
          min={0}
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-400">Languages</label>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => toggleLanguage(l)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                languages.includes(l)
                  ? "border-gold-500/50 bg-gold-500/10 text-gold-400"
                  : "border-navy-600 text-ink-400 hover:text-ink-100"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-ink-500">
        <div>
          <span className="block font-medium text-ink-400">RERA Number (BRN)</span>
          {broker.brn}
        </div>
        <div>
          <span className="block font-medium text-ink-400">ORN</span>
          {broker.orn}
        </div>
      </div>

      {broker.account_status === "approved" && (
        <Link
          href={`/brokers/${broker.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-medium text-gold-400 hover:text-gold-300"
        >
          View Public Profile <ExternalLink className="h-3 w-3" />
        </Link>
      )}

      {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}
      {savedMsg && <p className="text-xs font-medium text-emerald-400">{savedMsg}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

function photoUrlPreview(pending: File | null, current: string | null, name: string) {
  const src = pending ? URL.createObjectURL(pending) : current;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="h-14 w-14 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-500 text-lg font-semibold text-navy-950">
      {name.charAt(0)}
    </span>
  );
}
