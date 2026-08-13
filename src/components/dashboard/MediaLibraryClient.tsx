"use client";

import { useState } from "react";
import { ProjectFileManager, documentCategories } from "@/components/dashboard/ProjectFileManager";
import { exteriorGalleryCategories, interiorGalleryCategories } from "@/lib/galleryCategories";
import { CompactSelect } from "@/components/public/CompactSelect";

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
              <CompactSelect
                label="Project"
                placeholder="Select a project…"
                value={selected}
                onChange={setSelected}
                allowClear={false}
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
              />
            </div>
            <div className="flex-1">
              <CompactSelect
                label={folder === "documents" ? "Document Type" : "Gallery Category"}
                placeholder={folder === "documents" ? "Select a document type…" : "Select a gallery category…"}
                value={category}
                onChange={setCategory}
                allowClear={false}
                options={
                  folder === "documents"
                    ? documentCategories.map((c) => ({ label: c, value: c }))
                    : [
                        ...exteriorGalleryCategories.map((c) => ({ label: c, value: c, group: "Exterior" })),
                        ...interiorGalleryCategories.map((c) => ({ label: c, value: c, group: "Interior" })),
                        { label: "General (Uncategorized)", value: UNCATEGORIZED },
                      ]
                }
              />
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
