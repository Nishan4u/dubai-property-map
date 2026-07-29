"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { File, ImageIcon, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { categorySlug } from "@/lib/documentCategories";
import { uploadFileWithProgress, type UploadWithProgressHandle } from "@/lib/uploadWithProgress";
import { UploadProgressItem, type UploadState } from "@/components/ui/UploadProgress";

const imageExtensions = /\.(jpe?g|png|webp|gif|avif)$/i;

const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB
const MAX_OTHER_BYTES = 20 * 1024 * 1024; // 20 MB (images, PDFs)

interface StoredFile {
  name: string;
  url: string;
}

interface UploadItem {
  id: string;
  file: File;
  state: UploadState;
  percent: number;
  errorMessage?: string;
  handle: UploadWithProgressHandle | null;
}

export { documentCategories } from "@/lib/documentCategories";

export function ProjectFileManager({
  projectId,
  folder,
  category,
  accept,
  pathOverride,
  onImagePreview,
}: {
  projectId: string;
  folder: "gallery" | "documents";
  category?: string;
  accept: string;
  /** Use a custom storage path instead of the gallery/documents convention
   * (e.g. per-unit-type floor plans). `folder` still controls whether the
   * "set as cover" button is offered. */
  pathOverride?: string;
  /** When provided, clicking an image file opens it here (a lightbox)
   * instead of navigating to it in a new tab. Non-image files (PDFs etc)
   * always open in a new tab regardless. */
  onImagePreview?: (url: string) => void;
}) {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const path =
    pathOverride ??
    (category
      ? `${projectId}/${folder}/${categorySlug(category)}`
      : `${projectId}/${folder}`);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: listError } = await supabase.storage
      .from("project-media")
      .list(path);

    if (listError) {
      setLoading(false);
      return;
    }

    const withUrls = (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder" && f.id !== null)
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

  function validateFile(file: File): string | null {
    if (accept && accept !== "*") {
      const patterns = accept.split(",").map((p) => p.trim());
      const matches = patterns.some((pattern) => {
        if (pattern.endsWith("/*")) return file.type.startsWith(pattern.slice(0, -1));
        return file.type === pattern;
      });
      if (!matches) return `"${file.name}" isn't an accepted file type.`;
    }
    const maxBytes = file.type.startsWith("video/") ? MAX_VIDEO_BYTES : MAX_OTHER_BYTES;
    if (file.size > maxBytes) {
      return `"${file.name}" is too large (max ${Math.round(maxBytes / (1024 * 1024))} MB).`;
    }
    return null;
  }

  function startUpload(item: UploadItem) {
    setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, state: "uploading", percent: 0, errorMessage: undefined } : u)));

    const safeName = item.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const objectPath = `${path}/${Date.now()}-${safeName}`;

    const handle = uploadFileWithProgress("project-media", objectPath, item.file, (percent) => {
      setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, percent } : u)));
    });

    setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, handle } : u)));

    handle.promise.then(({ error }) => {
      if (error) {
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, state: "error", errorMessage: error.message } : u))
        );
        return;
      }
      setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, state: "processing" } : u)));
      loadFiles().then(() => {
        setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, state: "complete" } : u)));
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== item.id));
        }, 2000);
      });
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateFile(file);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: UploadItem = {
      id,
      file,
      state: validationError ? "error" : "preparing",
      percent: 0,
      errorMessage: validationError ?? undefined,
      handle: null,
    };
    setUploads((prev) => [...prev, item]);
    if (!validationError) startUpload(item);
  }

  function handleCancel(id: string) {
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id);
      item?.handle?.abort();
      return prev.filter((u) => u.id !== id);
    });
  }

  function handleRetry(id: string) {
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id);
      if (item) startUpload(item);
      return prev;
    });
  }

  function handleRemoveFailed(id: string) {
    setUploads((prev) => prev.filter((u) => u.id !== id));
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
        Click to upload
        <input ref={inputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" />
      </label>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u) => (
            <UploadProgressItem
              key={u.id}
              fileName={u.file.name}
              fileSize={u.file.size}
              state={u.state}
              percent={u.percent}
              errorMessage={u.errorMessage}
              onCancel={() => handleCancel(u.id)}
              onRetry={() => handleRetry(u.id)}
              onRemove={() => handleRemoveFailed(u.id)}
            />
          ))}
        </div>
      )}

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
              {onImagePreview && imageExtensions.test(f.name) ? (
                <button
                  type="button"
                  onClick={() => onImagePreview(f.url)}
                  className="flex min-w-0 items-center gap-2 truncate text-left text-ink-200 hover:text-gold-400"
                >
                  <ImageIcon className="h-4 w-4 shrink-0 text-ink-500" />
                  <span className="truncate">{f.name.replace(/^\d+-/, "")}</span>
                </button>
              ) : (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-2 truncate text-ink-200 hover:text-gold-400"
                >
                  <File className="h-4 w-4 shrink-0 text-ink-500" />
                  <span className="truncate">{f.name.replace(/^\d+-/, "")}</span>
                </a>
              )}
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
