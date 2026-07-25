"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationPrefs {
  new_leads?: boolean;
  new_messages?: boolean;
}

export function DeveloperSettingsForm({
  developerId,
  notificationPrefs,
  leadWebhookUrl,
}: {
  developerId: string;
  notificationPrefs: NotificationPrefs;
  leadWebhookUrl: string;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(notificationPrefs);
  const [webhookUrl, setWebhookUrl] = useState(leadWebhookUrl);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function togglePref(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingPrefs(true);
    const supabase = createClient();
    await supabase
      .from("developers")
      .update({ notification_prefs: next })
      .eq("id", developerId);
    setSavingPrefs(false);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  async function saveWebhook() {
    setSavingWebhook(true);
    const supabase = createClient();
    await supabase
      .from("developers")
      .update({ lead_webhook_url: webhookUrl.trim() || null })
      .eq("id", developerId);
    setSavingWebhook(false);
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  }

  async function testWebhook() {
    if (!webhookUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(webhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "test",
          name: "Test Lead",
          email: "test@example.com",
          phone: "+971500000000",
          message: "This is a test lead from Dubai Property Map.",
        }),
      });
      setTestResult(
        res.ok
          ? `Success — endpoint responded with ${res.status}.`
          : `Endpoint responded with ${res.status} ${res.statusText}.`
      );
    } catch {
      setTestResult(
        "Could not reach that URL (network or CORS error) — double check it accepts POST requests from a browser."
      );
    }
    setTesting(false);
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Settings</h1>
        <p className="text-sm text-ink-400">
          Notification preferences and lead delivery for your developer
          account.
        </p>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
        <p className="text-sm font-semibold text-ink-100">
          Notification Preferences
        </p>
        <p className="mt-1 text-xs text-ink-500">
          Controls the real in-app notifications you get in the
          Notifications page — turning these off does not stop the
          approval/status notices you get for your account.
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-ink-200">
            <input
              type="checkbox"
              checked={prefs.new_leads ?? true}
              onChange={() => togglePref("new_leads")}
              className="h-4 w-4 rounded border-navy-600 bg-navy-800"
            />
            Notify me about new leads &amp; enquiries
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-200">
            <input
              type="checkbox"
              checked={prefs.new_messages ?? true}
              onChange={() => togglePref("new_messages")}
              className="h-4 w-4 rounded border-navy-600 bg-navy-800"
            />
            Notify me about new messages
          </label>
        </div>
        {(savingPrefs || prefsSaved) && (
          <p className="mt-3 text-xs font-medium text-emerald-400">
            {savingPrefs ? "Saving…" : "Saved"}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
        <p className="text-sm font-semibold text-ink-100">Lead Webhook</p>
        <p className="mt-1 text-xs text-ink-500">
          Optional — paste your own CRM/Zapier/Make webhook URL and every new
          lead or viewing request submitted on your projects will be POSTed
          there in real time as JSON.
        </p>
        <input
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://hooks.zapier.com/hooks/catch/..."
          className="mt-3 w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={saveWebhook}
            disabled={savingWebhook}
            className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {savingWebhook ? "Saving…" : webhookSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={testWebhook}
            disabled={testing || !webhookUrl.trim()}
            className="rounded-lg border border-navy-600 px-4 py-2 text-xs font-medium text-ink-300 hover:text-ink-100 disabled:opacity-50"
          >
            {testing ? "Sending…" : "Send Test Lead"}
          </button>
        </div>
        {testResult && (
          <p className="mt-3 text-xs font-medium text-ink-300">{testResult}</p>
        )}
      </div>
    </div>
  );
}
