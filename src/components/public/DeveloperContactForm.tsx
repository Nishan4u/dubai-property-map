"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifyDeveloperTeam } from "@/lib/notify";

export function DeveloperContactForm({ developerId }: { developerId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.from("developer_messages").insert({
      developer_id: developerId,
      name,
      email,
      phone,
      message,
    });

    if (!error) {
      await notifyDeveloperTeam(
        developerId,
        `New message from ${name}: "${message.slice(0, 80)}${message.length > 80 ? "…" : ""}"`,
        undefined,
        "new_messages"
      );
    }

    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-emerald-600/40 bg-emerald-500/10 p-5 text-sm text-emerald-300">
        Thanks — your message has been sent to the developer.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-navy-700 bg-navy-850 p-5">
      <p className="text-sm font-semibold text-ink-100">Contact This Developer</p>
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
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      <textarea
        required
        rows={3}
        placeholder="Your message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
      />
      {status === "error" && (
        <p className="text-xs font-medium text-rose-400">
          Something went wrong — please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
