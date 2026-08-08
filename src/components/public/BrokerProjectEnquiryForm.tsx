"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type VerificationStatus = "loading" | "guest" | "unverified" | "inactive" | "ok";

// Enquiries submitted here go to the Broker, never the Developer (spec
// section 2) -- a completely separate channel from ProjectEnquiryPanel.tsx,
// which is untouched. Gated to registered users, same bar as every other
// enquiry/lead form on the site (is_verified_active_user(), patch_48).
export function BrokerProjectEnquiryForm({
  brokerId,
  projectId,
  projectName,
  brokerName,
}: {
  brokerId: string;
  projectId: string;
  projectName: string;
  brokerName: string;
}) {
  const [verification, setVerification] = useState<VerificationStatus>("loading");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(`Hi, I'm interested in ${projectName}.`);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/account/verification-status")
      .then((r) => r.json())
      .then((d) => setVerification(d.status ?? "guest"))
      .catch(() => setVerification("guest"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setErrorMsg("Not signed in.");
      return;
    }

    const { error } = await supabase.from("broker_project_enquiries").insert({
      broker_id: brokerId,
      project_id: projectId,
      created_by: user.id,
      name,
      email: email || null,
      phone: phone || null,
      message: message || null,
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("done");
  }

  if (verification === "loading") return null;

  if (verification !== "ok") {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5 text-center">
        <p className="text-sm font-medium text-ink-100">Register or Log In to Enquire</p>
        <p className="mt-1 text-xs text-ink-400">Register or log in to send an enquiry directly to {brokerName}.</p>
        <div className="mt-3 flex gap-2">
          <Link href="/login" className="flex-1 rounded-lg border border-navy-600 py-2 text-center text-sm font-medium text-ink-200 hover:text-ink-100">
            Login
          </Link>
          <Link href="/register" className="flex-1 rounded-lg bg-gold-500 py-2 text-center text-sm font-semibold text-navy-950 hover:bg-gold-400">
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
        <p className="text-sm font-medium text-emerald-400">Enquiry Sent</p>
        <p className="mt-1 text-xs text-ink-400">{brokerName} will get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-5">
      <p className="text-sm font-semibold text-ink-100">Enquire with {brokerName}</p>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone"
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 focus:outline-none"
      />
      {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send Enquiry"}
      </button>
    </form>
  );
}
