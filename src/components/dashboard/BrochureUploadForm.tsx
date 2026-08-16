"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Upload } from "lucide-react";

export function BrochureUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/developer/projects/extract-brochure", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(typeof data?.error === "string" && data.error.trim() ? data.error : "Extraction failed -- please try again.");
        return;
      }
      // Lands on the existing project edit page -- it already handles
      // pre-filled edit mode fully, no separate review UI needed here.
      router.push(`/dashboard/projects/${data.projectId}`);
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong uploading the file -- please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-gold-400">
        <Sparkles className="h-5 w-5" />
        <h1 className="text-xl font-bold text-ink-100">Upload Brochure</h1>
      </div>
      <p className="text-sm text-ink-400">
        Upload a project brochure (PDF) and AI will read it and draft a project for you to review and edit --
        nothing goes live until you submit it, same as creating a project manually.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-6">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-navy-600 px-6 py-10 text-center hover:border-gold-500/50">
          <Upload className="h-8 w-8 text-ink-500" />
          <span className="text-sm font-medium text-ink-200">
            {file ? file.name : "Click to choose a PDF brochure"}
          </span>
          <span className="text-xs text-ink-500">PDF only, up to 20MB</span>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {errorMsg && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={!file || status === "loading"}
          className="w-full rounded-lg bg-gold-500 py-3 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-50"
        >
          {status === "loading" ? "Reading document -- this can take a moment…" : "Extract & Create Draft"}
        </button>
      </form>
    </div>
  );
}
