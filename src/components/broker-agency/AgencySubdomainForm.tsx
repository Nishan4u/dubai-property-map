"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";

// Lets an agency claim/change their White-Label Storefront subdomain --
// mirrors BrokerAgencyLogoUpload.tsx's "small focused editor mounted into
// the read-only profile page" shape. Goes through a server route (not a
// direct client .update() like the logo upload) so format/reserved-word/
// uniqueness validation returns a friendly message instead of a raw
// Postgres constraint-violation string.
export function AgencySubdomainForm({ currentSubdomain }: { currentSubdomain: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(currentSubdomain ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/broker-agency/subdomain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subdomain: value }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not save that subdomain.");
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  const previewSlug = value.trim().toLowerCase() || "your-agency";

  return (
    <form onSubmit={handleSave} className="rounded-xl border border-navy-700 bg-navy-850 p-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-gold-400" />
        <h2 className="text-sm font-semibold text-ink-100">White-Label Storefront</h2>
      </div>
      <p className="mt-1 text-xs text-ink-500">
        Claim a subdomain and share a branded page of your featured properties, with your own logo and contact
        details instead of Dubai Property Map&apos;s.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase())}
          placeholder="your-agency"
          className="w-full max-w-[220px] rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <span className="text-xs text-ink-500">.dubaipropertymap.ae</span>
        <button
          type="submit"
          disabled={saving || !value.trim() || value.trim() === currentSubdomain}
          className="ml-auto rounded-lg bg-gold-500 px-4 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-500">
        Preview: <span className="text-ink-300">https://{previewSlug}.dubaipropertymap.ae</span>
      </p>
      {error && <p className="mt-2 text-xs font-medium text-rose-400">{error}</p>}
      {saved && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-400">
          <Check className="h-3.5 w-3.5" /> Saved. Manage which properties show on{" "}
          <a href="/broker-agency/storefront" className="underline">
            the Storefront page
          </a>
          .
        </p>
      )}
    </form>
  );
}
