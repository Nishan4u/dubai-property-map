"use client";

import { useState } from "react";
import { Pencil, Plus, Rocket, Trash2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CoordinatesPicker } from "@/components/dashboard/CoordinatesPicker";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { UploadProgressItem } from "@/components/ui/UploadProgress";
import type { UpcomingProjectRow } from "@/types/database";

const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 };

export function UpcomingProjectsManager({
  developerId,
  initialUpcomingProjects,
}: {
  developerId: string;
  initialUpcomingProjects: UpcomingProjectRow[];
}) {
  const [items, setItems] = useState(initialUpcomingProjects);
  const [name, setName] = useState("");
  const [coords, setCoords] = useState(DUBAI_CENTER);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCoords, setEditCoords] = useState(DUBAI_CENTER);

  const [logoUploadingId, setLogoUploadingId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPercent, setLogoPercent] = useState(0);
  const [logoError, setLogoError] = useState("");

  async function addUpcomingProject() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("upcoming_projects")
      .insert({
        developer_id: developerId,
        internal_name: name.trim(),
        lat: coords.lat,
        lng: coords.lng,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setName("");
      setCoords(DUBAI_CENTER);
    }
  }

  function startEdit(row: UpcomingProjectRow) {
    setEditingId(row.id);
    setEditName(row.internal_name);
    setEditCoords({ lat: row.lat, lng: row.lng });
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("upcoming_projects")
      .update({ internal_name: editName.trim(), lat: editCoords.lat, lng: editCoords.lng })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setItems((prev) => prev.map((u) => (u.id === id ? data : u)));
      setEditingId(null);
    }
  }

  async function removeUpcomingProject(id: string) {
    setItems((prev) => prev.filter((u) => u.id !== id));
    const supabase = createClient();
    await supabase.from("upcoming_projects").delete().eq("id", id);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const uploadedAt = Date.now();
    const rowId = e.currentTarget.dataset.upcomingId;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !rowId) return;
    setLogoUploadingId(rowId);
    setLogoFile(file);
    setLogoPercent(0);
    setLogoError("");

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `developer-logos/${developerId}/upcoming/${rowId}/${uploadedAt}-${safeName}`;
    const { promise } = uploadFileWithProgress("project-media", path, file, setLogoPercent);
    const { error: uploadError } = await promise;

    if (uploadError) {
      setLogoError(uploadError.message);
      setLogoFile(null);
      setLogoUploadingId(null);
      return;
    }

    const { data: pub } = supabase.storage.from("project-media").getPublicUrl(path);
    const { data } = await supabase
      .from("upcoming_projects")
      .update({ logo_url: pub.publicUrl })
      .eq("id", rowId)
      .select()
      .single();

    if (data) setItems((prev) => prev.map((u) => (u.id === rowId ? data : u)));
    setLogoFile(null);
    setLogoUploadingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((u) =>
          editingId === u.id ? (
            <div key={u.id} className="rounded-lg border border-gold-500/40 bg-navy-900 p-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Internal project name (never shown publicly)"
                className="mb-2 w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
              <CoordinatesPicker
                lat={editCoords.lat}
                lng={editCoords.lng}
                onChange={(lat, lng) => setEditCoords({ lat, lng })}
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => saveEdit(u.id)}
                  className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-ink-300 hover:text-ink-100"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2.5 text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy-600 bg-navy-950">
                  {u.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.logo_url} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Rocket className="h-4 w-4 text-ink-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-ink-100">{u.internal_name}</p>
                  <p className="text-xs text-ink-500">
                    {u.lat.toFixed(4)}, {u.lng.toFixed(4)} ·{" "}
                    <span
                      className={
                        u.status === "active" ? "text-sky-400" : "text-emerald-400"
                      }
                    >
                      {u.status === "active" ? "Coming Soon (live on map)" : "Launched"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <label className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-ink-500 hover:text-gold-400">
                  {logoUploadingId === u.id ? (
                    "Uploading…"
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" /> Logo
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={logoUploadingId === u.id}
                    data-upcoming-id={u.id}
                    onChange={handleLogoUpload}
                  />
                </label>
                {u.status === "active" && (
                  <button
                    onClick={() => startEdit(u)}
                    className="rounded-lg p-1.5 text-ink-500 hover:text-gold-400"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => removeUpcomingProject(u.id)}
                  className="rounded-lg p-1.5 text-ink-500 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {logoUploadingId === u.id && logoFile && (
                <div className="w-full">
                  <UploadProgressItem
                    fileName={logoFile.name}
                    fileSize={logoFile.size}
                    state={logoError ? "error" : "uploading"}
                    percent={logoPercent}
                    errorMessage={logoError}
                    onRemove={logoError ? () => { setLogoFile(null); setLogoUploadingId(null); } : undefined}
                  />
                </div>
              )}
            </div>
          )
        )}
        {items.length === 0 && (
          <p className="text-xs text-ink-500">No upcoming projects yet.</p>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-navy-600 p-3">
        <p className="mb-2 text-xs font-semibold text-ink-300">Add Upcoming Project</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Internal project name (never shown publicly)"
          className="mb-2 w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <CoordinatesPicker
          lat={coords.lat}
          lng={coords.lng}
          onChange={(lat, lng) => setCoords({ lat, lng })}
        />
        <p className="mt-2 text-xs text-ink-500">
          Only the pin location, your developer logo and name will be shown
          publicly on the map as &quot;Coming Soon&quot; — this internal name
          is visible only to you and Admin.
        </p>
        <button
          type="button"
          onClick={addUpcomingProject}
          disabled={saving || !name.trim()}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> {saving ? "Adding…" : "Add Upcoming Project"}
        </button>
      </div>
    </div>
  );
}
