"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function DeveloperOnboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [founded, setFounded] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg("Your session expired — please log in again.");
      setLoading(false);
      return;
    }

    const slug = `${slugify(name)}-${user.id.slice(0, 6)}`;
    // Generated client-side so we don't need `.select()` after the insert —
    // the new org isn't visible under any SELECT policy until the profile
    // below links to it, so asking PostgREST to return the inserted row
    // (which requires proving SELECT visibility) would always be rejected.
    const developerId = crypto.randomUUID();

    const { error: devError } = await supabase.from("developers").insert({
      id: developerId,
      slug,
      name,
      initial: name.charAt(0).toUpperCase(),
      founded: founded ? Number(founded) : null,
      description,
      status: "pending",
      verified: false,
    });

    if (devError) {
      setErrorMsg(devError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ developer_id: developerId })
      .eq("id", user.id);

    if (profileError) {
      setErrorMsg(profileError.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-850 p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-center text-lg font-semibold text-ink-100">
          Set up your developer profile
        </h1>
        <p className="mt-2 text-center text-sm text-ink-400">
          Tell us about your company. An admin will review and activate your
          account before your listings go live.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Company Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skyline Developments"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Founded (year)
            </label>
            <input
              type="number"
              value={founded}
              onChange={(e) => setFounded(e.target.value)}
              placeholder="2015"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              About your company
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-ink-100 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-rose-400">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
