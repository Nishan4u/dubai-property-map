"use client";

import { CheckCircle2, RotateCcw, X } from "lucide-react";

export type UploadState = "preparing" | "uploading" | "processing" | "complete" | "error";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadProgressItem({
  fileName,
  fileSize,
  state,
  percent,
  errorMessage,
  onCancel,
  onRetry,
  onRemove,
}: {
  fileName: string;
  fileSize: number;
  state: UploadState;
  percent: number;
  errorMessage?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-lg border border-navy-700 bg-navy-850 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-100">{fileName}</p>
          <p className="text-[11px] text-ink-500">{formatFileSize(fileSize)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {state === "complete" && (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Upload complete" />
          )}
          {state === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1 text-[11px] font-medium text-gold-400 hover:text-gold-300"
            >
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          )}
          {(state === "uploading" || state === "preparing") && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[11px] font-medium text-ink-400 hover:text-rose-400"
            >
              Cancel
            </button>
          )}
          {onRemove && state !== "uploading" && state !== "preparing" && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove"
              className="text-ink-500 hover:text-rose-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {state === "error" ? (
        <p className="mt-1.5 text-[11px] font-medium text-rose-400">{errorMessage ?? "Upload failed."}</p>
      ) : (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
            <div
              className={
                state === "complete"
                  ? "h-full rounded-full bg-emerald-500 transition-all"
                  : "h-full rounded-full bg-gold-500 transition-all"
              }
              style={{ width: `${state === "complete" ? 100 : percent}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-ink-500">
            {state === "preparing" && "Preparing…"}
            {state === "uploading" && `Uploading… ${percent}%`}
            {state === "processing" && "Processing…"}
            {state === "complete" && "Upload complete"}
          </p>
        </div>
      )}
    </div>
  );
}
