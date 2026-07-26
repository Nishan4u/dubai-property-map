"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Download, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trackProjectEvent } from "@/lib/trackEvent";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { notifyDeveloperTeam, sendLeadWebhook } from "@/lib/notify";

type VerificationStatus = "loading" | "guest" | "unverified" | "inactive" | "ok";

export function ProjectEnquiryPanel({
  projectId,
  projectName,
  developerId,
  brochureUrl,
  developerPhone,
}: {
  projectId: string;
  projectName: string;
  developerId: string;
  brochureUrl?: string | null;
  developerPhone?: string | null;
}) {
  const searchParams = useSearchParams();
  const initialEnquire = searchParams.get("enquire");
  const [mode, setMode] = useState<"closed" | "enquire" | "viewing">(
    initialEnquire === "viewing" ? "viewing" : initialEnquire === "general" ? "enquire" : "closed"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  // Book Appointment / Enquire Now is registered-users-only (checked again
  // by RLS server-side — this is just what decides what the UI shows).
  const [verification, setVerification] = useState<VerificationStatus>("loading");

  useEffect(() => {
    fetch("/api/account/verification-status")
      .then((r) => r.json())
      .then((d) => setVerification(d.status ?? "guest"))
      .catch(() => setVerification("guest"));
  }, []);
  const [showGate, setShowGate] = useState(false);

  function handleActionClick(nextMode: "enquire" | "viewing") {
    if (verification === "ok") {
      setMode(nextMode);
    } else if (verification !== "loading") {
      setShowGate(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: insertedLead, error: leadError } = await supabase
      .from("leads")
      .insert({
        project_id: projectId,
        name,
        email,
        phone,
        source: "Website",
        notes:
          mode === "viewing"
            ? `Requested a viewing${date ? ` on ${date}` : ""}.`
            : "General enquiry from project page.",
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (leadError || !insertedLead) {
      setStatus("error");
      return;
    }

    if (mode === "viewing" && date) {
      await supabase.from("bookings").insert({
        project_id: projectId,
        client_name: name,
        client_email: email,
        client_phone: phone,
        scheduled_date: date,
        status: "confirmed",
        created_by: user?.id ?? null,
      });
    }

    if (user) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        message:
          mode === "viewing" && date
            ? `Your viewing request for ${projectName} on ${date} has been submitted.`
            : `Your enquiry for ${projectName} has been received.`,
        project_id: projectId,
      });
    }

    await notifyDeveloperTeam(
      developerId,
      mode === "viewing" && date
        ? `New viewing request for ${projectName} from ${name}.`
        : `New enquiry for ${projectName} from ${name}.`,
      projectId,
      "new_leads"
    );

    await sendLeadWebhook(developerId, {
      event: mode === "viewing" && date ? "viewing_request" : "enquiry",
      project: projectName,
      name,
      email,
      phone,
      date: mode === "viewing" ? date : undefined,
    });

    fetch("/api/leads/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: insertedLead.id, isViewing: mode === "viewing" && !!date }),
    }).catch(() => {
      // Best-effort — the lead itself is already saved and visible to the
      // developer's dashboard regardless of whether the email goes out.
    });

    setStatus("done");
  }

  async function handleBrochureClick() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("brochure_downloads")
        .insert({ user_id: user.id, project_id: projectId });
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-emerald-600/40 bg-emerald-500/10 p-5 text-sm text-emerald-300">
        Thanks — the team behind {projectName} has received your{" "}
        {mode === "viewing" ? "viewing request" : "enquiry"} and will be in
        touch shortly.
      </div>
    );
  }

  if (mode === "closed") {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
        <p className="text-sm font-semibold text-ink-100">
          Interested in this project?
        </p>
        {showGate ? (
          <div className="mt-3 rounded-lg border border-gold-500/30 bg-gold-500/10 p-3">
            <p className="text-sm font-semibold text-gold-300">Registration Required</p>
            <p className="mt-1 text-xs text-ink-300">
              {verification === "unverified"
                ? "Please verify your email to continue."
                : verification === "inactive"
                  ? "Your account isn't active yet — contact support if this seems wrong."
                  : "Please register or log in to continue."}
            </p>
            {verification === "guest" && (
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  className="flex-1 rounded-lg bg-gold-500 py-1.5 text-center text-xs font-semibold text-navy-950 hover:bg-gold-400"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="flex-1 rounded-lg border border-navy-600 py-1.5 text-center text-xs font-medium text-ink-300 hover:text-ink-100"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => handleActionClick("viewing")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400"
            >
              <Calendar className="h-4 w-4" /> Book Appointment
            </button>
            <button
              onClick={() => handleActionClick("enquire")}
              className="mt-2 w-full rounded-lg border border-emerald-600/40 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10"
            >
              Enquire Now
            </button>
          </>
        )}
        {developerPhone && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a
              href={`tel:${developerPhone}`}
              onClick={() => trackProjectEvent(projectId, "phone")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-navy-600 py-2 text-xs font-medium text-ink-300 hover:text-ink-100"
            >
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
            <a
              href={getWhatsAppUrl(
                developerPhone,
                `Hi, I'm interested in ${projectName}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackProjectEvent(projectId, "whatsapp")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600/40 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>
        )}
        {brochureUrl ? (
          <a
            href={brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBrochureClick}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-navy-600 py-2.5 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            <Download className="h-4 w-4" /> Download Brochure
          </a>
        ) : (
          <button
            disabled
            title="No brochure uploaded yet"
            className="mt-2 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-navy-700 py-2.5 text-sm font-medium text-ink-600"
          >
            <Download className="h-4 w-4" /> Brochure Not Available
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
      <p className="text-sm font-semibold text-ink-100">
        {mode === "viewing" ? "Book a Viewing" : "Send an Enquiry"}
      </p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        <input
          required
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
        {mode === "viewing" && (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
          />
        )}
        {status === "error" && (
          <p className="text-xs font-medium text-rose-400">
            Something went wrong — please try again.
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex-1 rounded-lg bg-gold-500 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {status === "loading" ? "Sending…" : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => setMode("closed")}
            className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-medium text-ink-300 hover:text-ink-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
