"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { CompactSelect } from "@/components/public/CompactSelect";

interface ProjectOption {
  id: string;
  name: string;
  status: string;
  featured: boolean;
  featured_until: string | null;
}

// Deliberately its own section, not folded into AdRequestSection -- this
// isn't an ad_placements row (a banner/pin slot), it's the project's own
// `featured` flag (drives the homepage Featured carousel) plus an expiry,
// and doesn't go through admin pending/approval the way ad placements do.
export function FeatureProjectSection({ projects }: { projects: ProjectOption[] }) {
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("feature_checkout");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const liveProjects = projects.filter((p) => p.status === "published" || p.status === "featured");
  const now = new Date();
  const currentlyFeatured = projects.filter((p) => p.featured && (!p.featured_until || new Date(p.featured_until) > now));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setLoading(true);
    setErrorMsg("");

    const res = await fetch("/api/developer/feature-project-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-100">Feature a Project</h2>
        <p className="text-xs text-ink-500">AED 50 · shows in the homepage Featured carousel for 15 days · no subscription needed</p>
      </div>

      {checkoutState === "success" && (
        <p className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          Payment received — your project is now featured.
        </p>
      )}
      {checkoutState === "cancelled" && (
        <p className="rounded-lg border border-navy-600 bg-navy-850 px-4 py-2.5 text-sm text-ink-400">
          Checkout was cancelled — no charge was made.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
        <div className="min-w-56 flex-1">
          <CompactSelect
            label="Project"
            placeholder="Select a project…"
            value={projectId}
            onChange={setProjectId}
            options={liveProjects.map((p) => ({ label: p.name, value: p.id }))}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !projectId}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          {loading ? "Redirecting to payment…" : "Pay AED 50 & Feature"}
        </button>
      </form>
      {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

      {currentlyFeatured.length > 0 && (
        <DataTable
          columns={[
            { header: "Project", render: (p) => <span className="font-medium text-ink-100">{p.name}</span> },
            {
              header: "Featured Until",
              render: (p) => (p.featured_until ? new Date(p.featured_until).toLocaleDateString() : "No expiry (admin-set)"),
            },
            { header: "Status", render: () => <Badge tone="green">Featured</Badge> },
          ]}
          rows={currentlyFeatured}
        />
      )}
    </div>
  );
}
