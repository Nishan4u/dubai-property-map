"use client";

import { useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { Project } from "@/types";
import { developers } from "@/data/mock";

const allAmenities = [
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

export function ProjectForm({ project }: { project?: Project }) {
  const [amenities, setAmenities] = useState<string[]>(
    project?.amenities ?? []
  );
  const [saved, setSaved] = useState(false);

  function toggleAmenity(a: string) {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }}
      className="space-y-6"
    >
      <SectionCard title="General">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Project Name" defaultValue={project?.name} />
          <SelectField
            label="Developer"
            defaultValue={project?.developerId}
            options={developers.map((d) => ({ label: d.name, value: d.id }))}
          />
          <Field label="Community" defaultValue={project?.communityId} />
          <Field label="Coordinates (lat, lng)" placeholder="25.19, 55.27" />
          <SelectField
            label="Property Type"
            defaultValue={project?.propertyType}
            options={["Apartments", "Villas", "Townhouses", "Penthouse"].map((v) => ({
              label: v,
              value: v,
            }))}
          />
          <SelectField
            label="Status"
            defaultValue={project?.status}
            options={["draft", "published", "featured", "expired", "rejected", "archived"].map(
              (v) => ({ label: v, value: v })
            )}
          />
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-ink-400">
            Description
          </label>
          <textarea
            defaultValue={project?.description}
            rows={3}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          />
        </div>
      </SectionCard>

      <SectionCard title="Pricing & Payment Plan">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Starting Price (AED)" defaultValue={project?.priceFromAed?.toString()} />
          <Field label="Payment Plan" defaultValue={project?.paymentPlan} />
          <Field label="Handover" defaultValue={`${project?.handoverQuarter ?? ""} ${project?.handoverYear ?? ""}`} />
        </div>
      </SectionCard>

      <SectionCard title="Amenities">
        <div className="flex flex-wrap gap-2">
          {allAmenities.map((a) => (
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

      <SectionCard title="Gallery & Documents">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            "Images",
            "Videos / Drone",
            "360° Virtual Tour",
            "Master Plan",
            "Brochure (PDF)",
            "Price List (PDF)",
          ].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-dashed border-navy-600 px-4 py-3 text-sm text-ink-400"
            >
              {label}
              <span className="text-xs font-medium text-gold-400">Upload</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Construction Updates">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Progress %" defaultValue={project ? `${project.leads % 100}` : "0"} />
          <Field label="Latest Milestone" placeholder="e.g. Foundation complete" />
        </div>
      </SectionCard>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          {project ? "Save Changes" : "Submit for Review"}
        </button>
        {saved && (
          <span className="text-xs font-medium text-emerald-400">
            Saved (prototype only — not persisted)
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  defaultValue,
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">
        {label}
      </label>
      <input
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  defaultValue,
  options,
}: {
  label: string;
  defaultValue?: string;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">
        {label}
      </label>
      <select
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
