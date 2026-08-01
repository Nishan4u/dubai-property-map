"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { notifyDeveloperTeam } from "@/lib/notify";
import type { DbApprovalStatus, DbProjectStatus } from "@/types/database";

const approvalMessage: Record<DbApprovalStatus, (name: string) => string> = {
  approved: (name) => `Your project "${name}" has been approved and is now live.`,
  rejected: (name) => `Your project "${name}" was rejected. Check the listing details and resubmit.`,
  review: (name) => `Changes were requested for "${name}" — please review and update your listing.`,
  pending: (name) => `Your project "${name}" is pending review.`,
};

export function ProjectApprovalActions({
  projectId,
  projectName,
  developerId,
  featured,
  status,
}: {
  projectId: string;
  projectName: string;
  developerId: string;
  featured: boolean;
  status: DbProjectStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(featured);

  async function updateApproval(approval_status: DbApprovalStatus) {
    setLoading(true);
    const supabase = createClient();
    // A project that's still sitting in "draft" (e.g. bulk-imported for
    // review) isn't visible on the public site at all, no matter what its
    // approval_status says -- getPublishedProjects() only ever returns
    // status IN (published, featured). Approving one is the admin's signal
    // to make it live, matching what approvalMessage.approved actually
    // tells the developer ("...is now live"), so flip status too.
    const updates: { approval_status: DbApprovalStatus; status?: DbProjectStatus } = { approval_status };
    if (approval_status === "approved" && status === "draft") {
      updates.status = "published";
    }
    await supabase.from("projects").update(updates).eq("id", projectId);
    await logAudit(`project.${approval_status}`, "project", projectId);
    await notifyDeveloperTeam(
      developerId,
      approvalMessage[approval_status](projectName),
      projectId
    );
    router.refresh();
    setLoading(false);
  }

  async function toggleFeatured() {
    const next = !isFeatured;
    setIsFeatured(next);
    const supabase = createClient();
    await supabase.from("projects").update({ featured: next }).eq("id", projectId);
    await logAudit(next ? "project.featured" : "project.unfeatured", "project", projectId);
    if (next) {
      await notifyDeveloperTeam(
        developerId,
        `Your project "${projectName}" was marked as Featured.`,
        projectId
      );
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={loading}
        onClick={() => updateApproval("approved")}
        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        disabled={loading}
        onClick={() => updateApproval("rejected")}
        className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
      >
        Reject
      </button>
      <button
        disabled={loading}
        onClick={() => updateApproval("review")}
        className="text-xs font-medium text-ink-400 hover:text-ink-200 disabled:opacity-50"
      >
        Request Changes
      </button>
      <button
        onClick={toggleFeatured}
        title={isFeatured ? "Remove from Featured" : "Mark as Featured"}
        className={clsx(
          "flex items-center gap-1 text-xs font-medium",
          isFeatured ? "text-gold-400 hover:text-gold-300" : "text-ink-500 hover:text-ink-300"
        )}
      >
        <Star className={clsx("h-3.5 w-3.5", isFeatured && "fill-gold-400")} />
        Featured
      </button>
    </div>
  );
}
