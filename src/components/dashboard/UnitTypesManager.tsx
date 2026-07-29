"use client";

import { useState } from "react";
import { FileStack, Pencil, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProjectFileManager } from "@/components/dashboard/ProjectFileManager";
import { unitTypeOptions } from "@/lib/unitTypeOptions";
import type { ProjectUnitTypeRow } from "@/types/database";

const availabilityOptions: { label: string; value: ProjectUnitTypeRow["availability"] }[] = [
  { label: "Available", value: "available" },
  { label: "Limited", value: "limited" },
  { label: "Sold Out", value: "sold_out" },
];

const availabilityTone: Record<ProjectUnitTypeRow["availability"], string> = {
  available: "border-emerald-500/40 text-emerald-300",
  limited: "border-gold-500/40 text-gold-300",
  sold_out: "border-rose-500/40 text-rose-300",
};

type DraftFields = {
  unitName: string;
  unitType: string;
  startingPrice: string;
  sizeSqft: string;
  bedrooms: string;
  bathrooms: string;
  hasBalcony: boolean;
  hasParking: boolean;
  availability: ProjectUnitTypeRow["availability"];
};

const emptyDraft: DraftFields = {
  unitName: "",
  unitType: unitTypeOptions[0],
  startingPrice: "",
  sizeSqft: "",
  bedrooms: "",
  bathrooms: "",
  hasBalcony: false,
  hasParking: false,
  availability: "available",
};

function rowToDraft(row: ProjectUnitTypeRow): DraftFields {
  return {
    unitName: row.unit_name,
    unitType: row.unit_type,
    startingPrice: row.starting_price_aed?.toString() ?? "",
    sizeSqft: row.size_sqft?.toString() ?? "",
    bedrooms: row.bedrooms?.toString() ?? "",
    bathrooms: row.bathrooms?.toString() ?? "",
    hasBalcony: row.has_balcony,
    hasParking: row.has_parking,
    availability: row.availability,
  };
}

function draftToPayload(draft: DraftFields) {
  return {
    unit_name: draft.unitName.trim(),
    unit_type: draft.unitType,
    starting_price_aed: draft.startingPrice.trim() === "" ? null : Number(draft.startingPrice),
    size_sqft: draft.sizeSqft.trim() === "" ? null : Number(draft.sizeSqft),
    bedrooms: draft.bedrooms.trim() === "" ? null : Number(draft.bedrooms),
    bathrooms: draft.bathrooms.trim() === "" ? null : Number(draft.bathrooms),
    has_balcony: draft.hasBalcony,
    has_parking: draft.hasParking,
    availability: draft.availability,
  };
}

export function UnitTypesManager({
  projectId,
  initialUnitTypes,
}: {
  projectId: string;
  initialUnitTypes: ProjectUnitTypeRow[];
}) {
  const [unitTypes, setUnitTypes] = useState(initialUnitTypes);
  const [draft, setDraft] = useState<DraftFields>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftFields>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [floorPlansOpenId, setFloorPlansOpenId] = useState<string | null>(null);

  async function addUnitType() {
    if (!draft.unitName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("project_unit_types")
      .insert({
        project_id: projectId,
        sort_order: unitTypes.length,
        ...draftToPayload(draft),
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setUnitTypes((prev) => [...prev, data]);
      setDraft(emptyDraft);
    }
  }

  function startEdit(row: ProjectUnitTypeRow) {
    setEditingId(row.id);
    setEditDraft(rowToDraft(row));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    if (!editDraft.unitName.trim()) return;
    const supabase = createClient();
    const payload = draftToPayload(editDraft);
    const { data, error } = await supabase
      .from("project_unit_types")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setUnitTypes((prev) => prev.map((u) => (u.id === id ? data : u)));
      setEditingId(null);
    }
  }

  async function removeUnitType(id: string) {
    setUnitTypes((prev) => prev.filter((u) => u.id !== id));
    const supabase = createClient();
    await supabase.from("project_unit_types").delete().eq("id", id);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {unitTypes.map((u) =>
          editingId === u.id ? (
            <div key={u.id} className="rounded-lg border border-gold-500/40 bg-navy-900 p-3">
              <UnitTypeFields draft={editDraft} onChange={setEditDraft} />
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => saveEdit(u.id)}
                  className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink-100">{u.unit_name}</span>
                  <span className="text-xs text-ink-500">{u.unit_type}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${availabilityTone[u.availability]}`}
                  >
                    {availabilityOptions.find((o) => o.value === u.availability)?.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-500">
                  {[
                    u.starting_price_aed != null ? `AED ${u.starting_price_aed.toLocaleString()}` : null,
                    u.size_sqft != null ? `${u.size_sqft.toLocaleString()} sq ft` : null,
                    u.bedrooms != null ? `${u.bedrooms} Bed` : null,
                    u.bathrooms != null ? `${u.bathrooms} Bath` : null,
                    u.has_balcony ? "Balcony" : null,
                    u.has_parking ? "Parking" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setFloorPlansOpenId((cur) => (cur === u.id ? null : u.id))}
                  title="Floor Plans"
                  className={
                    floorPlansOpenId === u.id
                      ? "rounded-lg p-1.5 text-gold-400"
                      : "rounded-lg p-1.5 text-ink-500 hover:text-gold-400"
                  }
                >
                  <FileStack className="h-4 w-4" />
                </button>
                <button
                  onClick={() => startEdit(u)}
                  className="rounded-lg p-1.5 text-ink-500 hover:text-gold-400"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeUnitType(u.id)}
                  className="rounded-lg p-1.5 text-ink-500 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {floorPlansOpenId === u.id && (
                <div className="w-full border-t border-navy-800 pt-3">
                  <p className="mb-2 text-xs font-semibold text-ink-300">
                    Floor Plans for {u.unit_name}
                  </p>
                  <ProjectFileManager
                    projectId={projectId}
                    folder="documents"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    pathOverride={`${projectId}/floor-plans/${u.id}`}
                  />
                </div>
              )}
            </div>
          )
        )}
        {unitTypes.length === 0 && (
          <p className="text-xs text-ink-500">No unit types added yet.</p>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-navy-600 p-3">
        <p className="mb-2 text-xs font-semibold text-ink-300">Add Unit Type</p>
        <UnitTypeFields draft={draft} onChange={setDraft} />
        <button
          type="button"
          onClick={addUnitType}
          disabled={saving || !draft.unitName.trim()}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> {saving ? "Adding…" : "Add Unit Type"}
        </button>
      </div>
    </div>
  );
}

function UnitTypeFields({
  draft,
  onChange,
}: {
  draft: DraftFields;
  onChange: (d: DraftFields) => void;
}) {
  function set<K extends keyof DraftFields>(key: K, value: DraftFields[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <input
        placeholder="Unit Name (e.g. Type A)"
        value={draft.unitName}
        onChange={(e) => set("unitName", e.target.value)}
        className="col-span-2 rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none sm:col-span-1"
      />
      <select
        value={draft.unitType}
        onChange={(e) => set("unitType", e.target.value)}
        className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 focus:outline-none"
      >
        {unitTypeOptions.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Starting Price (AED)"
        value={draft.startingPrice}
        onChange={(e) => set("startingPrice", e.target.value)}
        className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      <input
        type="number"
        placeholder="Sq Ft"
        value={draft.sizeSqft}
        onChange={(e) => set("sizeSqft", e.target.value)}
        className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      <input
        type="number"
        placeholder="Bedrooms"
        value={draft.bedrooms}
        onChange={(e) => set("bedrooms", e.target.value)}
        className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      <input
        type="number"
        placeholder="Bathrooms"
        value={draft.bathrooms}
        onChange={(e) => set("bathrooms", e.target.value)}
        className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      <select
        value={draft.availability}
        onChange={(e) => set("availability", e.target.value as DraftFields["availability"])}
        className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 text-xs text-ink-100 focus:outline-none"
      >
        {availabilityOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-2.5 py-1.5 text-xs text-ink-300">
        <input
          type="checkbox"
          checked={draft.hasBalcony}
          onChange={(e) => set("hasBalcony", e.target.checked)}
          className="accent-gold-500"
        />
        Balcony
      </label>
      <label className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-2.5 py-1.5 text-xs text-ink-300">
        <input
          type="checkbox"
          checked={draft.hasParking}
          onChange={(e) => set("hasParking", e.target.checked)}
          className="accent-gold-500"
        />
        Parking
      </label>
    </div>
  );
}
