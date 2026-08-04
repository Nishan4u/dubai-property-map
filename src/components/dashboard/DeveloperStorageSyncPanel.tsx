"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface Connection {
  bucket_name: string;
  region: string;
  access_key_id: string;
  status: "active" | "paused";
  last_synced_at: string | null;
  last_sync_file_count: number | null;
  last_sync_error: string | null;
}

// Opt-in, additive S3 media backup -- entirely separate from how project
// media is actually uploaded and served today (the "project-media"
// Supabase Storage bucket, via ProjectFileManager.tsx and friends, which
// this panel never touches). Mirrors IntegrationsPanel.tsx's overall
// shape (inline create/edit form + a status readout), but the secret
// access key is never sent back to the browser once saved -- leaving it
// blank on a later save keeps whatever's already stored.
export function DeveloperStorageSyncPanel({ connection }: { connection: Connection | null }) {
  const router = useRouter();
  const [bucketName, setBucketName] = useState(connection?.bucket_name ?? "");
  const [region, setRegion] = useState(connection?.region ?? "");
  const [accessKeyId, setAccessKeyId] = useState(connection?.access_key_id ?? "");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncResult, setSyncResult] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSyncResult(null);

    const res = await fetch("/api/developer/storage-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucketName, region, accessKeyId, secretAccessKey }),
    });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? "Failed to save.");
      setSaving(false);
      return;
    }

    setSecretAccessKey("");
    setSaving(false);
    router.refresh();
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setError("");

    const res = await fetch("/api/developer/storage-sync", { method: "POST" });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? "Sync failed.");
      setSyncing(false);
      return;
    }

    setSyncResult(`Synced ${body.fileCount} file${body.fileCount === 1 ? "" : "s"}.`);
    setSyncing(false);
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
      <div>
        <h2 className="text-sm font-semibold text-ink-100">S3 Media Backup</h2>
        <p className="mt-1 text-xs text-ink-500">
          Optionally mirror every gallery image and document from your projects into your own Amazon S3 bucket.
          One-way and on-demand — nothing about how you upload media here changes. Use IAM credentials scoped to
          only this one bucket, not your AWS account&apos;s root keys.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Bucket Name</label>
          <input
            value={bucketName}
            onChange={(e) => setBucketName(e.target.value)}
            placeholder="my-company-media"
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Region</label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="me-central-1"
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Access Key ID</label>
          <input
            value={accessKeyId}
            onChange={(e) => setAccessKeyId(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">
            Secret Access Key {connection && <span className="text-ink-500">(leave blank to keep current)</span>}
          </label>
          <input
            type="password"
            value={secretAccessKey}
            onChange={(e) => setSecretAccessKey(e.target.value)}
            placeholder={connection ? "••••••••" : ""}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {saving ? "Saving…" : connection ? "Update Connection" : "Save Connection"}
          </button>
        </div>
      </form>

      {connection && (
        <div className="border-t border-navy-800 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-500">
              {connection.last_synced_at
                ? `Last synced ${new Date(connection.last_synced_at).toLocaleString()} — ${connection.last_sync_file_count ?? 0} file(s).`
                : "Never synced yet."}
              {connection.last_sync_error && <span className="text-rose-400"> Last error: {connection.last_sync_error}</span>}
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-4 py-2 text-xs font-medium text-ink-300 hover:text-ink-100 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync Now"}
            </button>
          </div>
          {syncResult && <p className="mt-2 text-xs text-emerald-400">{syncResult}</p>}
        </div>
      )}
    </div>
  );
}
