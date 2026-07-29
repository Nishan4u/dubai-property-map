"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Upload } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { CoordinatesPicker } from "@/components/dashboard/CoordinatesPicker";
import { ConstructionMilestonesManager } from "@/components/dashboard/ConstructionMilestonesManager";
import { UnitTypesManager } from "@/components/dashboard/UnitTypesManager";
import { createClient } from "@/lib/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";
import { unitTypeOptions } from "@/lib/unitTypeOptions";
import type { Community, Project, ProjectTag } from "@/types";
import type { ConstructionMilestoneRow, ProjectUnitTypeRow, UpcomingProjectRow } from "@/types/database";

const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 };

const fallbackAmenities = [
  "Pool",
  "Gym",
  "Kids Area",
  "Cinema",
  "Sky Lounge",
  "Beach",
  "Golf",
  "Smart Home",
  "Parking",
  "Pet Friendly",
];
const fallbackPropertyTypes = ["Apartments", "Villas", "Townhouses", "Penthouse"];

const allTags: { label: string; value: ProjectTag }[] = [
  { label: "New Launch", value: "new-launch" },
  { label: "Luxury", value: "luxury" },
  { label: "Waterfront", value: "waterfront" },
  { label: "Villas", value: "villas" },
  { label: "Under 1M", value: "under-1m" },
  { label: "High ROI", value: "high-roi" },
];

const gradients = [
  "from-amber-500/40 via-slate-800 to-slate-950",
  "from-sky-500/40 via-slate-800 to-slate-950",
  "from-emerald-500/40 via-slate-800 to-slate-950",
  "from-fuchsia-500/40 via-slate-800 to-slate-950",
  "from-rose-500/40 via-slate-800 to-slate-950",
  "from-indigo-500/40 via-slate-800 to-slate-950",
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProjectForm({
  project,
  developerId,
  developerOptions,
  communities,
  constructionMilestones = [],
  unitTypeRows = [],
  activeUpcomingProjects = [],
  propertyTypes = fallbackPropertyTypes,
  amenityOptions = fallbackAmenities,
}: {
  project?: Project;
  developerId?: string;
  developerOptions?: { id: string; name: string }[];
  communities: Community[];
  constructionMilestones?: ConstructionMilestoneRow[];
  unitTypeRows?: ProjectUnitTypeRow[];
  /** Developer's own "Coming Soon" pins not yet linked to a live project
   * (spec section 13 launch workflow) -- only offered on the create form. */
  activeUpcomingProjects?: UpcomingProjectRow[];
  propertyTypes?: string[];
  amenityOptions?: string[];
}) {
  const router = useRouter();
  const [amenities, setAmenities] = useState<string[]>(project?.amenities ?? []);
  const [tags, setTags] = useState<ProjectTag[]>(project?.tags ?? []);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [coords, setCoords] = useState({
    lat: project?.lat ?? DUBAI_CENTER.lat,
    lng: project?.lng ?? DUBAI_CENTER.lng,
  });
  const [linkedUpcomingId, setLinkedUpcomingId] = useState("");

  function handleLinkUpcoming(id: string) {
    setLinkedUpcomingId(id);
    const match = activeUpcomingProjects.find((u) => u.id === id);
    if (match) setCoords({ lat: match.lat, lng: match.lng });
  }
  const [unitPrices, setUnitPrices] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [k, v] of Object.entries(project?.unitTypePrices ?? {})) {
      initial[k] = String(v);
    }
    return initial;
  });
  const [installments, setInstallments] = useState<{ label: string; percent: string }[]>(
    (project?.paymentPlanDetails ?? []).map((d) => ({
      label: d.label,
      percent: String(d.percent),
    }))
  );
  const [logoUrl, setLogoUrl] = useState(project?.logoUrl ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPercent, setLogoPercent] = useState(0);
  const [logoError, setLogoError] = useState("");

  function toggleAmenity(a: string) {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function toggleTag(t: ProjectTag) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function addInstallment() {
    setInstallments((prev) => [...prev, { label: "", percent: "" }]);
  }

  function updateInstallment(i: number, field: "label" | "percent", value: string) {
    setInstallments((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );
  }

  function removeInstallment(i: number) {
    setInstallments((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !project) return;
    setLogoFile(file);
    setLogoPercent(0);
    setLogoError("");

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${project.id}/logo/${Date.now()}-${safeName}`;
    const { promise } = uploadFileWithProgress("project-media", path, file, setLogoPercent);
    const { error: uploadError } = await promise;

    if (uploadError) {
      setLogoError(uploadError.message);
      setLogoFile(null);
      return;
    }

    const { data } = supabase.storage.from("project-media").getPublicUrl(path);
    await supabase.from("projects").update({ logo_url: data.publicUrl }).eq("id", project.id);

    setLogoUrl(data.publicUrl);
    setLogoFile(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "");

    const payload = {
      name,
      community_id: String(formData.get("community_id")),
      property_type: String(formData.get("property_type")),
      price_from_aed: Number(formData.get("price_from_aed")) || 0,
      payment_plan: String(formData.get("payment_plan") ?? ""),
      escrow_status: String(formData.get("escrow_status") ?? "").trim() || null,
      furnishing: String(formData.get("furnishing") ?? "").trim() || null,
      bedrooms_from: Number(formData.get("bedrooms_from")) || 0,
      bedrooms_to: Number(formData.get("bedrooms_to")) || 0,
      handover_quarter: String(formData.get("handover_quarter") ?? ""),
      handover_year: Number(formData.get("handover_year")) || null,
      description: String(formData.get("description") ?? ""),
      video_url: String(formData.get("video_url") ?? "").trim() || null,
      virtual_tour_url: String(formData.get("virtual_tour_url") ?? "").trim() || null,
      launch_date: String(formData.get("launch_date") ?? "").trim() || null,
      lat: coords.lat,
      lng: coords.lng,
      unit_type_prices: Object.fromEntries(
        Object.entries(unitPrices)
          .filter(([, v]) => v.trim() !== "")
          .map(([k, v]) => [k, Number(v)])
      ),
      payment_plan_details: installments
        .filter((i) => i.label.trim() !== "" && i.percent.trim() !== "")
        .map((i) => ({ label: i.label.trim(), percent: Number(i.percent) })),
      amenities,
      tags,
    };

    const supabase = createClient();

    if (project) {
      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", project.id);

      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
        return;
      }
    } else {
      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;
      const resolvedDeveloperId = developerOptions
        ? String(formData.get("developer_id"))
        : developerId;
      const linkedUpcoming = activeUpcomingProjects.find((u) => u.id === linkedUpcomingId);
      const { data: created, error } = await supabase
        .from("projects")
        .insert({
          ...payload,
          slug,
          developer_id: resolvedDeveloperId,
          listing_type: "off-plan",
          status: "published",
          approval_status: developerOptions ? "approved" : "pending",
          unit_types: [],
          gradient: gradients[Math.floor(Math.random() * gradients.length)],
          rating: 0,
          reviews: 0,
          views: 0,
          ...(linkedUpcoming?.logo_url ? { logo_url: linkedUpcoming.logo_url } : {}),
        })
        .select()
        .single();

      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
        return;
      }

      // Launch workflow (spec section 13): hides the "Coming Soon" pin by
      // marking it launched, keeping the record for reference rather than
      // deleting it.
      if (linkedUpcoming && created) {
        await supabase
          .from("upcoming_projects")
          .update({ status: "launched", launched_project_id: created.id })
          .eq("id", linkedUpcoming.id);
      }
    }

    setStatus("saved");
    router.push(developerOptions ? "/admin/projects" : "/dashboard/projects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard title="General">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {developerOptions && !project && (
            <SelectField
              label="Developer"
              name="developer_id"
              options={developerOptions.map((d) => ({ label: d.name, value: d.id }))}
            />
          )}
          <Field
            label="Project Name"
            name="name"
            defaultValue={project?.name}
            required
          />
          <SelectField
            label="Community"
            name="community_id"
            defaultValue={project?.communityId}
            options={communities.map((c) => ({ label: c.name, value: c.id }))}
          />
          <SelectField
            label="Property Type"
            name="property_type"
            defaultValue={project?.propertyType}
            options={propertyTypes.map((v) => ({
              label: v,
              value: v,
            }))}
          />
        </div>
        {!project && activeUpcomingProjects.length > 0 && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Link to Upcoming Project
            </label>
            <select
              value={linkedUpcomingId}
              onChange={(e) => handleLinkUpcoming(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            >
              <option value="">— None —</option>
              {activeUpcomingProjects.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.internal_name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-500">
              Linking will hide that &quot;Coming Soon&quot; pin, carry over
              its location and logo, and publish this as the live project.
            </p>
          </div>
        )}
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-ink-400">
            Description
          </label>
          <textarea
            name="description"
            defaultValue={project?.description}
            rows={3}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          />
        </div>
      </SectionCard>

      <SectionCard title="Project Logo">
        {project ? (
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-navy-600 bg-navy-900">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={project.name} className="h-full w-full object-contain p-2" />
              ) : (
                <span className="text-xs text-ink-500">No logo</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-600 px-4 py-2.5 text-sm text-ink-300 hover:border-gold-500/40 hover:text-ink-100">
                <Upload className="h-4 w-4" />
                {logoFile ? "Uploading…" : logoUrl ? "Replace Logo" : "Upload Logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={!!logoFile}
                  onChange={handleLogoUpload}
                />
              </label>
              <p className="mt-2 text-xs text-ink-500">
                Shown on the project card, details page, map popup and search
                results. PNG, SVG, JPG or WEBP.
              </p>
              {logoFile && (
                <div className="mt-2 max-w-xs">
                  <UploadProgressItem
                    fileName={logoFile.name}
                    fileSize={logoFile.size}
                    state={logoError ? "error" : "uploading"}
                    percent={logoPercent}
                    errorMessage={logoError}
                    onRemove={logoError ? () => setLogoFile(null) : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-500">
            Save this project first, then come back to upload a logo.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Pricing & Payment Plan">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="Starting Price (AED)"
            name="price_from_aed"
            type="number"
            defaultValue={project?.priceFromAed?.toString()}
          />
          <Field
            label="Payment Plan"
            name="payment_plan"
            defaultValue={project?.paymentPlan}
            placeholder="e.g. 70/30"
          />
          <SelectField
            label="Escrow Account"
            name="escrow_status"
            defaultValue={project?.escrowStatus ?? ""}
            options={[
              { label: "Leave blank", value: "" },
              { label: "Available", value: "available" },
              { label: "Not Available", value: "not_available" },
            ]}
          />
          <SelectField
            label="Furnishing"
            name="furnishing"
            defaultValue={project?.furnishing ?? ""}
            options={[
              { label: "Leave blank", value: "" },
              { label: "Furnished", value: "furnished" },
              { label: "Unfurnished", value: "unfurnished" },
              { label: "Semi-Furnished", value: "semi_furnished" },
            ]}
          />
          <SelectField
            label="Handover Quarter"
            name="handover_quarter"
            defaultValue={project?.handoverQuarter}
            options={["Q1", "Q2", "Q3", "Q4", "Ready"].map((v) => ({ label: v, value: v }))}
          />
          <Field
            label="Handover Year"
            name="handover_year"
            type="number"
            defaultValue={project?.handoverYear?.toString()}
          />
          <Field
            label="Bedrooms From"
            name="bedrooms_from"
            type="number"
            defaultValue={project?.bedroomsFrom?.toString() ?? "0"}
          />
          <Field
            label="Bedrooms To"
            name="bedrooms_to"
            type="number"
            defaultValue={project?.bedroomsTo?.toString() ?? "0"}
          />
          <Field
            label="Launch Date"
            name="launch_date"
            type="date"
            defaultValue={project?.launchDate ?? ""}
          />
        </div>
      </SectionCard>

      <SectionCard title="Location">
        <CoordinatesPicker
          lat={coords.lat}
          lng={coords.lng}
          onChange={(lat, lng) => setCoords({ lat, lng })}
        />
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={coords.lat}
              onChange={(e) =>
                setCoords((prev) => ({ ...prev, lat: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={coords.lng}
              onChange={(e) =>
                setCoords((prev) => ({ ...prev, lng: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Price by Unit Type">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {unitTypeOptions.map((u) => (
            <div key={u}>
              <label className="mb-1 block text-xs font-medium text-ink-400">{u}</label>
              <input
                type="number"
                placeholder="AED"
                value={unitPrices[u] ?? ""}
                onChange={(e) =>
                  setUnitPrices((prev) => ({ ...prev, [u]: e.target.value }))
                }
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-500">
          Leave a unit type blank if it&apos;s not offered in this project.
        </p>
      </SectionCard>

      <SectionCard title="Unit Types">
        {project ? (
          <UnitTypesManager projectId={project.id} initialUnitTypes={unitTypeRows} />
        ) : (
          <p className="text-sm text-ink-500">
            Save this project first, then come back to add detailed unit
            types (name, size, bedrooms, bathrooms, balcony, parking and
            availability).
          </p>
        )}
      </SectionCard>

      <SectionCard title="Installment Plan">
        <div className="space-y-2">
          {installments.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="e.g. On Booking"
                value={item.label}
                onChange={(e) => updateInstallment(i, "label", e.target.value)}
                className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="%"
                value={item.percent}
                onChange={(e) => updateInstallment(i, "percent", e.target.value)}
                className="w-24 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeInstallment(i)}
                className="text-ink-500 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addInstallment}
            className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
          >
            <Plus className="h-3.5 w-3.5" /> Add Milestone
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Amenities">
        <div className="flex flex-wrap gap-2">
          {amenityOptions.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => toggleAmenity(a)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                amenities.includes(a)
                  ? "bg-gold-500 text-navy-950"
                  : "border border-navy-600 text-ink-300 hover:text-ink-100"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Tags">
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => toggleTag(t.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                tags.includes(t.value)
                  ? "bg-gold-500 text-navy-950"
                  : "border border-navy-600 text-ink-300 hover:text-ink-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Video & Virtual Tour">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Video URL (YouTube, Vimeo, drone footage…)"
            name="video_url"
            defaultValue={project?.videoUrl ?? ""}
            placeholder="https://youtube.com/watch?v=..."
          />
          <Field
            label="360° Virtual Tour URL (Matterport, Kuula…)"
            name="virtual_tour_url"
            defaultValue={project?.virtualTourUrl ?? ""}
            placeholder="https://my.matterport.com/show/?m=..."
          />
        </div>
        <p className="mt-2 text-xs text-ink-500">
          These links appear on the map pin popup and the project details page. Leave
          blank to hide.
        </p>
      </SectionCard>

      <SectionCard title="Documents & Media">
        {project ? (
          <p className="text-sm text-ink-400">
            Manage images and documents for this project from{" "}
            <Link href="/dashboard/media" className="text-gold-400 hover:underline">
              Media Library
            </Link>{" "}
            and{" "}
            <Link href="/dashboard/documents" className="text-gold-400 hover:underline">
              Documents
            </Link>
            {" "}— select &quot;{project.name}&quot; from the project dropdown there.
          </p>
        ) : (
          <p className="text-sm text-ink-500">
            Save this project first, then come back to add images and documents
            from the Media Library and Documents pages.
          </p>
        )}
      </SectionCard>

      {project && (
        <SectionCard title="Construction Updates">
          <ConstructionMilestonesManager
            projectId={project.id}
            initialProgress={project.constructionProgressPercent ?? 0}
            initialMilestones={constructionMilestones}
          />
        </SectionCard>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          {status === "loading"
            ? "Saving…"
            : project
              ? "Save Changes"
              : "Submit for Review"}
        </button>
        {status === "error" && (
          <span className="text-xs font-medium text-rose-400">{errorMsg}</span>
        )}
        {!project && (
          <span className="text-xs text-ink-500">
            New projects go live once an admin approves them.
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
