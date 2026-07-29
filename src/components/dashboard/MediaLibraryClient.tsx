"use client";

import { useState } from "react";
import { ProjectFileManager, documentCategories } from "@/components/dashboard/ProjectFileManager";
import { exteriorGalleryCategories, interiorGalleryCategories } from "@/lib/galleryCategories";

const UNCATEGORIZED = "__uncategorized__";

export function MediaLibraryClient({
  title,
  description,
  folder,
  accept,
  projects,
}: {
  title: string;
  description: string;
  folder: "gallery" | "documents";
  accept: string;
  projects: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState(projects[0]?.id ?? "");
  const [category, setCategory] = useState(
    folder === "documents" ? documentCategories[0] : exteriorGalleryCategories[0]
  );

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">{title}</h1>
        <p className="text-sm text-ink-400">{description}</p>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-ink-500">
          Add a project first, then come back here to manage its files.
        </p>
      ) : (
        <div className="max-w-2xl space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-ink-400">Project</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-ink-400">
                {folder === "documents" ? "Document Type" : "Gallery Category"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              >
                {folder === "documents" ? (
                  documentCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  <>
                    <optgroup label="Exterior">
                      {exteriorGalleryCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Interior">
                      {interiorGalleryCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <option value={UNCATEGORIZED}>General (Uncategorized)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {selected && (
            <ProjectFileManager
              key={`${selected}-${category}`}
              projectId={selected}
              folder={folder}
              category={category === UNCATEGORIZED ? undefined : category}
              accept={accept}
            />
          )}
        </div>
      )}
    </div>
  );
}
