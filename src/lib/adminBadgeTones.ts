import type { ApprovalStatus, ProjectStatus } from "@/types";

export const projectStatusTone: Record<ProjectStatus, "neutral" | "green" | "gold" | "red" | "purple"> = {
  draft: "neutral",
  published: "green",
  featured: "purple",
  expired: "gold",
  rejected: "red",
  archived: "neutral",
};

export const projectApprovalTone: Record<ApprovalStatus, "gold" | "blue" | "green" | "red"> = {
  pending: "gold",
  review: "blue",
  approved: "green",
  rejected: "red",
};
