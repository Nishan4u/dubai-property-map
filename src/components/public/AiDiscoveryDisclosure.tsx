import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

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
export function AiDiscoveryDisclosure() {
  return (
    <Badge tone="blue" className="items-start gap-1.5 whitespace-normal text-left">
      <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
      <span>Compiled by AI from public news sources -- not yet verified against DLD records.</span>
    </Badge>
  );
}
