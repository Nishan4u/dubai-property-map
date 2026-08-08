"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { notifyDeveloperTeam } from "@/lib/notify";

// Broker -> developer interest enquiry on a "Coming Soon" pin (patch_131).
// Resolves the viewer's own broker profile client-side (rather than
// threading a new prop through page.tsx -> HomeClient -> DubaiMap) since
// this modal is the only place that needs it. Gracefully degrades to a
// login/register prompt for anyone who isn't a signed-in broker -- never a
// dead end, always a real next action.
export function UpcomingProjectInterestModal({
  upcomingProjectId,
  developerId,
  developerName,
  onClose,
}: {
  upcomingProjectId: string;
  developerId: string;
  developerName: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      if (!data.user) {
        setLoading(false);
        return;
      }
      setSignedIn(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("broker_id")
        .eq("id", data.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!profile?.broker_id) {
        setLoading(false);
        return;
      }
      const { data: broker } = await supabase
        .from("brokers")
        .select("id, full_name, email, whatsapp")
        .eq("id", profile.broker_id)
        .maybeSingle();
      if (cancelled) return;
      if (broker) {
        setBrokerId(broker.id);
        setName(broker.full_name ?? "");
        setEmail(broker.email ?? "");
        setWhatsapp(broker.whatsapp ?? "");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brokerId || !name.trim()) return;
    setSubmitting(true);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("upcoming_project_interests").insert({
      upcoming_project_id: upcomingProjectId,
      broker_id: brokerId,
      created_by: user?.id,
      name: name.trim(),
      email: email.trim() || null,
      whatsapp: whatsapp.trim() || null,
      message: message.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    // Best-effort -- the developer's own collection page (Upcoming
    // Projects -> Interests) is the real source of truth regardless of
    // whether this notification succeeds.
    notifyDeveloperTeam(
      developerId,
      `${name.trim()} is interested in your upcoming project`,
      undefined,
      "new_leads"
    ).catch(() => {});

    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-navy-700 bg-navy-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-100">Submit Interest</p>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-ink-500">Loading…</p>
        ) : submitted ? (
          <p className="text-sm text-emerald-400">
            Thanks — {developerName} has been notified of your interest.
          </p>
        ) : !signedIn ? (
          <div className="space-y-3">
            <p className="text-xs text-ink-400">
              Log in as a broker to express interest in {developerName}&apos;s upcoming project.
            </p>
            <Link
              href="/login"
              className="block rounded-lg bg-gold-500 py-2 text-center text-xs font-semibold text-navy-950 hover:bg-gold-400"
            >
              Login
            </Link>
          </div>
        ) : !brokerId ? (
          <div className="space-y-3">
            <p className="text-xs text-ink-400">
              Only registered brokers can submit interest in &quot;Coming Soon&quot; projects.
            </p>
            <Link
              href="/register"
              className="block rounded-lg bg-gold-500 py-2 text-center text-xs font-semibold text-navy-950 hover:bg-gold-400"
            >
              Register as a Broker
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-ink-400">
              Let {developerName} know you&apos;re interested in this upcoming project.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">WhatsApp</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
              />
            </div>
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full rounded-lg bg-gold-500 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Interest"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
