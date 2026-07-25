"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ContentPage {
  slug: string;
  title: string;
  body: string;
}

export function ContentEditor({ pages }: { pages: ContentPage[] }) {
  const [active, setActive] = useState(pages[0]?.slug ?? "");
  const [drafts, setDrafts] = useState<Record<string, ContentPage>>(
    Object.fromEntries(pages.map((p) => [p.slug, p]))
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const current = drafts[active];

  async function handleSave() {
    setStatus("saving");
    const supabase = createClient();
    await supabase
      .from("site_content")
      .update({
        title: current.title,
        body: current.body,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", current.slug);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  if (!current) return <p className="text-sm text-ink-500">No content pages found.</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <div className="space-y-1">
        {pages.map((p) => (
          <button
            key={p.slug}
            onClick={() => setActive(p.slug)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium capitalize ${
              active === p.slug
                ? "bg-gold-500 text-navy-950"
                : "text-ink-300 hover:bg-navy-800"
            }`}
          >
            {p.slug}
          </button>
        ))}
      </div>

      <div className="space-y-4 sm:col-span-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
          <input
            value={current.title}
            onChange={(e) =>
              setDrafts((prev) => ({
                ...prev,
                [active]: { ...current, title: e.target.value },
              }))
            }
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Body</label>
          <textarea
            rows={10}
            value={current.body}
            onChange={(e) =>
              setDrafts((prev) => ({
                ...prev,
                [active]: { ...current, body: e.target.value },
              }))
            }
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save Changes"}
        </button>
        <p className="text-xs text-ink-500">
          Live on the public site at /{current.slug}
        </p>
      </div>
    </div>
  );
}
