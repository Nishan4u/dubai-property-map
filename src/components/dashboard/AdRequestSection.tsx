"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";

const statusTone = {
  pending: "gold",
  active: "green",
  rejected: "red",
  expired: "neutral",
} as const;

const placementOptions = [
  { label: "Homepage Banner", value: "homepage_banner" },
  { label: "Sidebar Banner", value: "sidebar_banner" },
  { label: "Sponsored Map Pin", value: "sponsored_pin" },
  { label: "Community Banner", value: "community_banner" },
  { label: "Project Page Banner", value: "project_page_banner" },
  { label: "Developer Page Banner", value: "developer_page_banner" },
];

interface Placement {
  id: string;
  title: string;
  placement_type: string;
  status: "pending" | "active" | "rejected" | "expired";
  starts_at: string | null;
  ends_at: string | null;
}

export function AdRequestSection({
  placements,
  projects,
  communities,
}: {
  placements: Placement[];
  projects: { id: string; name: string }[];
  communities: { id: string; name: string }[];
}) {
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("ad_checkout");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [placementType, setPlacementType] = useState(placementOptions[0].value);
  const [targetUrl, setTargetUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await fetch("/api/stripe/ad-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        placementType,
        targetUrl: targetUrl || null,
        projectId:
          placementType === "sponsored_pin" || placementType === "project_page_banner"
            ? projectId || null
            : null,
        communityId: placementType === "community_banner" ? communityId || null : null,
      }),
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-100">Advertise Your Projects</h2>
          <p className="text-xs text-ink-500">AED 500 per placement · runs for 15 days</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          Request Placement
        </button>
      </div>

      {checkoutState === "success" && (
        <p className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          Payment received — your placement is now pending admin review before it goes live.
        </p>
      )}
      {checkoutState === "cancelled" && (
        <p className="rounded-lg border border-navy-600 bg-navy-850 px-4 py-2.5 text-sm text-ink-400">
          Checkout was cancelled — no charge was made.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chelsea Residences launch banner"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Placement</label>
            <select
              value={placementType}
              onChange={(e) => setPlacementType(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            >
              {placementOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Link URL</label>
            <input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="/projects/your-project-slug"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          {(placementType === "sponsored_pin" || placementType === "project_page_banner") && (
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                {placementType === "sponsored_pin"
                  ? "Project to highlight on the map"
                  : "Project page to display the banner on"}
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              >
                <option value="">Select a project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {placementType === "community_banner" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                Community page to display on
              </label>
              <select
                required
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              >
                <option value="">Select a community…</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {errorMsg && (
            <p className="text-xs font-medium text-rose-400 sm:col-span-2">{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 sm:col-span-2"
          >
            {loading ? "Redirecting to payment…" : "Pay AED 500 & Submit"}
          </button>
        </form>
      )}

      <DataTable
        columns={[
          { header: "Title", render: (p) => <span className="font-medium text-ink-100">{p.title}</span> },
          {
            header: "Placement",
            render: (p) => placementOptions.find((o) => o.value === p.placement_type)?.label ?? p.placement_type,
          },
          { header: "Dates", render: (p) => `${p.starts_at ?? "—"} → ${p.ends_at ?? "—"}` },
          { header: "Status", render: (p) => <Badge tone={statusTone[p.status]}>{p.status}</Badge> },
        ]}
        rows={placements}
      />
    </div>
  );
}
