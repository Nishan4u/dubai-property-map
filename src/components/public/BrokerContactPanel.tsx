"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";

type Status = "loading" | "guest" | "gated" | "ok";

export function BrokerContactPanel({ slug, brokerName }: { slug: string; brokerName: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [contact, setContact] = useState<{ email: string; mobile: string; whatsapp: string } | null>(null);

  useEffect(() => {
    fetch(`/api/brokers/${slug}/contact`)
      .then(async (r) => {
        const data = await r.json();
        if (r.ok && data.status === "ok") {
          setContact({ email: data.email, mobile: data.mobile, whatsapp: data.whatsapp });
          setStatus("ok");
        } else if (data.status === "guest") {
          setStatus("guest");
        } else {
          setStatus("gated");
        }
      })
      .catch(() => setStatus("gated"));
  }, [slug]);

  if (status === "loading") {
    return <div className="h-24 animate-pulse rounded-xl border border-navy-700 bg-navy-850" />;
  }

  if (status === "ok" && contact) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-850 p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-100">Contact {brokerName}</h2>
        <div className="space-y-2 text-sm text-ink-300">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gold-400" /> {contact.mobile}
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gold-400" /> {contact.email}
          </p>
        </div>
        <a
          href={getWhatsAppUrl(contact.whatsapp, `Hi ${brokerName}, I found your profile on Dubai Property Map.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-emerald-400"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850 p-5 text-center">
      <h2 className="text-sm font-semibold text-ink-100">Contact {brokerName}</h2>
      <p className="mt-1 text-xs text-ink-400">
        Register or log in to view {brokerName}&apos;s contact information and connect directly via WhatsApp.
      </p>
      <div className="mt-4 flex gap-2">
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
