import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

function relativeTime(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

/**
 * Small, factual public disclosure for a project sourced via AI Project
 * Discovery (patch_150) -- web research, not a developer submission.
 * Deliberately scoped to `aiSourceType === "web_discovery"` only, not
 * every `dataSource === "ai_extracted"` project: a brochure upload was
 * submitted by the real developer and always goes through human review
 * before publishing, so it doesn't carry the same "unverified" caveat.
 * `blue` tone, not `gold` -- gold already signals Featured/premium on
 * this page and would send the wrong message here.
 */
export function AiDiscoveryDisclosure({ lastCheckedAt }: { lastCheckedAt?: string | null }) {
  return (
    <Badge tone="blue" className="items-start gap-1.5 whitespace-normal text-left">
      <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
      <span>
        Compiled by AI from public news sources -- not yet verified against DLD records.
        {lastCheckedAt && ` Last checked ${relativeTime(lastCheckedAt)}.`}
      </span>
    </Badge>
  );
}
