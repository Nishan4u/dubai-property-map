"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";

type Channel = "email" | "sms";

// Audience is fixed, not a segment builder: every CRM client with the
// relevant contact channel on file who hasn't opted out. crm_clients
// (patch_98) is the only real, broker/salesperson-collected contact list
// in this schema -- buyer/developer profiles have no phone column and no
// capture flow for one, so building a fake audience picker on top of
// data that doesn't exist would overstate what this can actually target.
export function AdminCreateCampaignForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setChannel("email");
    setSubject("");
    setBody("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;

    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("marketing_campaigns")
      .insert({
        name: name.trim(),
        channel,
        subject: channel === "email" ? subject.trim() || null : null,
        body: body.trim(),
        status: "draft",
      })
      .select()
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to create campaign.");
      setSaving(false);
      return;
    }

    await logAudit("marketing_campaign.create", "marketing_campaign", data.id, { name: name.trim(), channel });
    setSaving(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4 sm:grid-cols-2"
        >
          <p className="text-sm font-semibold text-ink-100 sm:col-span-2">New Campaign</p>
          <p className="text-xs text-ink-500 sm:col-span-2">
            Sends to every CRM client with an {channel === "email" ? "email" : "phone number"} on file who hasn&apos;t
            opted out. Saved as a draft first — nothing sends until you click Send from the table below.
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q1 Off-Plan Launch"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          {channel === "email" && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-400">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. New payment plans are now available"
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ink-400">Message</label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the campaign message…"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>}

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
