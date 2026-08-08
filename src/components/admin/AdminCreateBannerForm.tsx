"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";

const PLACEMENT_OPTIONS = [
  { value: "homepage_banner", label: "Homepage Banner" },
  { value: "sidebar_banner", label: "Sidebar Banner" },
  { value: "sponsored_pin", label: "Sponsored Map Pin (needs a project)" },
  { value: "community_banner", label: "Community Banner (needs a community)" },
  { value: "project_page_banner", label: "Project Page Banner (needs a project)" },
  { value: "developer_page_banner", label: "Developer Page Banner" },
  { value: "projects_infeed_banner", label: "Projects Listing In-Feed" },
  { value: "blog_inarticle_banner", label: "Blog Post In-Article" },
];

interface Option {
  id: string;
  name: string;
}

// Admin-originated banners skip the developer request/approval cycle
// entirely -- they're created directly as status: "active" via the
// existing "ad_placements: admin manages all" RLS policy (patch_9), which
// already grants admins unrestricted insert/update/delete. This closes
// the one gap in the otherwise-complete ad_placements system: admin could
// only approve/reject developer-submitted requests (AdPlacementActions),
// never originate a platform-run promo (e.g. a seasonal banner not tied
// to a paid developer ad) on their own.
export function AdminCreateBannerForm({
  developers,
  communities,
  projects,
}: {
  developers: Option[];
  communities: Option[];
  projects: (Option & { developerId: string })[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [placementType, setPlacementType] = useState(PLACEMENT_OPTIONS[0].value);
  const [developerId, setDeveloperId] = useState(developers[0]?.id ?? "");
  const [projectId, setProjectId] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingFile(file);
    setUploadPercent(0);
    setUploadError("");

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `ad-banners/${Date.now()}-${safeName}`;
    const { promise } = uploadFileWithProgress("project-media", path, file, setUploadPercent);
    const { error: uploadErr } = await promise;
    if (uploadErr) {
      setUploadError(uploadErr.message);
      setUploadingFile(null);
      return;
    }
    const { data } = supabase.storage.from("project-media").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploadingFile(null);
  }

  const needsProject = placementType === "sponsored_pin" || placementType === "project_page_banner";
  const needsCommunity = placementType === "community_banner";
  const projectsForDeveloper = projects.filter((p) => !developerId || p.developerId === developerId);

  function reset() {
    setPlacementType(PLACEMENT_OPTIONS[0].value);
    setProjectId("");
    setCommunityId("");
    setTitle("");
    setTargetUrl("");
    setStartsAt("");
    setEndsAt("");
    setImageUrl("");
    setUploadingFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!developerId || !title.trim()) return;
    if (needsProject && !projectId) {
      setError("This placement type needs a project selected.");
      return;
    }
    if (needsCommunity && !communityId) {
      setError("This placement type needs a community selected.");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("ad_placements")
      .insert({
        developer_id: developerId,
        project_id: needsProject ? projectId : null,
        community_id: needsCommunity ? communityId : null,
        placement_type: placementType,
        title: title.trim(),
        target_url: targetUrl.trim() || null,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
        image_url: imageUrl || null,
        status: "active",
      })
      .select()
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to create banner.");
      setSaving(false);
      return;
    }

    await logAudit("ad_placement.admin_created", "ad_placement", data.id, { title: title.trim(), placementType });
    setSaving(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> Create Banner
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4 sm:grid-cols-2"
        >
          <p className="text-sm font-semibold text-ink-100 sm:col-span-2">Create Banner</p>
          <p className="text-xs text-ink-500 sm:col-span-2">
            Goes live immediately — no developer request or approval step, unlike the ones below.
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Placement Type</label>
            <select
              value={placementType}
              onChange={(e) => setPlacementType(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            >
              {PLACEMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Attributed Developer</label>
            <select
              value={developerId}
              onChange={(e) => {
                setDeveloperId(e.target.value);
                setProjectId("");
              }}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            >
              {developers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {needsProject && (
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              >
                <option value="">Select a project…</option>
                {projectsForDeveloper.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {needsCommunity && (
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Community</label>
              <select
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

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ramadan Off-Plan Sale"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 rounded-lg border border-dashed border-navy-600 p-3">
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Banner Image (optional)
            </label>
            <p className="mb-2 text-[11px] text-ink-500">
              Uploaded design is shown as the banner instead of the plain text version above/below
              — set the Link field right below so clicking the image opens that page.
            </p>
            {imageUrl && !uploadingFile && (
              <div className="mb-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Banner preview"
                  className="h-16 w-auto rounded-lg border border-navy-600 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="flex items-center gap-1 text-xs text-ink-400 hover:text-rose-400"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            )}
            {uploadingFile && (
              <div className="mb-2">
                <UploadProgressItem
                  fileName={uploadingFile.name}
                  fileSize={uploadingFile.size}
                  state={uploadError ? "error" : uploadPercent >= 100 ? "complete" : "uploading"}
                  percent={uploadPercent}
                  errorMessage={uploadError || undefined}
                  onCancel={() => setUploadingFile(null)}
                />
              </div>
            )}
            <label className="mb-3 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100">
              <Upload className="h-3.5 w-3.5" />
              {imageUrl ? "Replace image" : "Upload image"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            <label className="mb-1 block text-xs font-medium text-ink-400">
              Link {imageUrl ? "(opens when the image above is clicked)" : "(opens when the banner is clicked)"}
            </label>
            <input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-ink-500">
              Leave empty for a non-clickable banner. Every click is tracked and redirected
              through <code className="text-ink-400">/api/ads/click/[id]</code> to this URL.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Starts (optional)</label>
            <input
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Ends (optional)</label>
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>

          {error && <p className="text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>}

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create & Publish"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
