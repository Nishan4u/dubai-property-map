"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { File, ImageIcon, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { categorySlug } from "@/lib/documentCategories";

const imageExtensions = /\.(jpe?g|png|webp|gif|avif)$/i;

interface StoredFile {
  name: string;
  url: string;
}

export { documentCategories } from "@/lib/documentCategories";

export function ProjectFileManager({
  projectId,
  folder,
  category,
  accept,
}: {
  projectId: string;
  folder: "gallery" | "documents";
  category?: string;
  accept: string;
}) {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const path =
    folder === "documents" && category
      ? `${projectId}/${folder}/${categorySlug(category)}`
      : `${projectId}/${folder}`;

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: listError } = await supabase.storage
      .from("project-media")
      .list(path);

    if (listError) {
      setError(listError.message);
      setLoading(false);
      return;
    }

    const withUrls = (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => ({
        name: f.name,
        url: supabase.storage.from("project-media").getPublicUrl(`${path}/${f.name}`)
          .data.publicUrl,
      }));

    setFiles(withUrls);
    setLoading(false);
  }, [path]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    if (folder !== "gallery") return;
    const supabase = createClient();
    supabase
      .from("projects")
      .select("cover_image_url")
      .eq("id", projectId)
      .single()
      .then(({ data }) => setCoverUrl(data?.cover_image_url ?? null));
  }, [folder, projectId]);

  async function handleSetCover(url: string) {
    setCoverUrl(url);
    const supabase = createClient();
    await supabase
      .from("projects")
      .update({ cover_image_url: url })
      .eq("id", projectId);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const { error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(`${path}/${Date.now()}-${safeName}`, file);

    if (uploadError) setError(uploadError.message);
    e.target.value = "";
    setUploading(false);
    loadFiles();
  }

  async function handleDelete(name: string) {
    const supabase = createClient();
    await supabase.storage.from("project-media").remove([`${path}/${name}`]);
    loadFiles();
  }

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy-600 px-4 py-6 text-sm text-ink-400 hover:border-gold-500/40 hover:text-ink-200">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Click to upload"}
        <input type="file" accept={accept} onChange={handleUpload} className="hidden" />
      </label>

      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink-500">Loading files…</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-ink-500">No files uploaded yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((f) => (
            <li
              key={f.name}
              className="flex items-center justify-between gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 text-sm"
            >
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 truncate text-ink-200 hover:text-gold-400"
              >
                <File className="h-4 w-4 shrink-0 text-ink-500" />
                <span className="truncate">{f.name.replace(/^\d+-/, "")}</span>
              </a>
              <div className="flex shrink-0 items-center gap-2">
                {folder === "gallery" && imageExtensions.test(f.name) && (
                  <button
                    onClick={() => handleSetCover(f.url)}
                    title={
                      coverUrl === f.url
                        ? "This is the cover photo"
                        : "Set as cover photo"
                    }
                    className={
                      coverUrl === f.url
                        ? "text-gold-400"
                        : "text-ink-500 hover:text-gold-400"
                    }
                  >
                    <ImageIcon
                      className={clsx("h-4 w-4", coverUrl === f.url && "fill-gold-400/20")}
                    />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(f.name)}
                  className="text-ink-500 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
