"use client";

import { useState } from "react";
import { ProjectFileManager, documentCategories } from "@/components/dashboard/ProjectFileManager";

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
  const [category, setCategory] = useState(documentCategories[0]);

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
            {folder === "documents" && (
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  Document Type
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
                >
                  {documentCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selected && (
            <ProjectFileManager
              key={`${selected}-${folder === "documents" ? category : "gallery"}`}
              projectId={selected}
              folder={folder}
              category={folder === "documents" ? category : undefined}
              accept={accept}
            />
          )}
        </div>
      )}
    </div>
  );
}
