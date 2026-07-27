"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function CopyReferralButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold-500 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
    >
      <Copy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy Code"}
    </button>
  );
}
