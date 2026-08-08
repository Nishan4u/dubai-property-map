"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const SITE_URL = "https://dubaipropertymap.ae";

export function EmbedCodeGenerator({
  developerSlug,
  embedViews,
}: {
  developerSlug: string;
  embedViews: number;
}) {
  const [copied, setCopied] = useState(false);
  const embedUrl = `${SITE_URL}/embed/developer/${developerSlug}`;
  const snippet = `<iframe src="${embedUrl}" width="100%" height="500" style="border:0;border-radius:12px;" loading="lazy" title="Our properties on Dubai Property Map"></iframe>`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied -- the snippet is still selectable text.
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-4">
        <p className="text-xs text-ink-500">Embed Views (all-time)</p>
        <p className="mt-1 text-2xl font-bold text-ink-100">{embedViews.toLocaleString()}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-100">Embed Code</h2>
        <p className="mb-3 text-xs text-ink-400">
          Paste this into your own website&apos;s HTML to show a live, interactive map of your
          own projects — visitors can click a pin to view full details and enquire, right back
          on Dubai Property Map.
        </p>
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg border border-navy-700 bg-navy-950 p-4 text-xs text-ink-300">
            <code>{snippet}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-navy-800 px-2.5 py-1.5 text-xs font-medium text-ink-200 hover:bg-navy-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-100">Live Preview</h2>
        <p className="mb-3 text-xs text-ink-400">Exactly what visitors will see on your site.</p>
        <iframe
          src={embedUrl}
          width="100%"
          height="500"
          loading="lazy"
          title="Embed preview"
          className="rounded-xl border border-navy-700"
        />
      </div>
    </div>
  );
}
