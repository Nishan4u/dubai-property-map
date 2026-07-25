"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import type { DeveloperMessageRow } from "@/types/database";

export default function DeveloperMessagesPage() {
  const [messages, setMessages] = useState<DeveloperMessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("developer_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoading(false);
      });
  }, []);

  async function markRead(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    const supabase = createClient();
    await supabase.from("developer_messages").update({ read: true }).eq("id", id);
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Messages</h1>
        <p className="text-sm text-ink-400">
          Enquiries submitted via your public developer profile&apos;s contact form.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-500">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-ink-500">No messages yet.</p>
      ) : (
        <ul className="divide-y divide-navy-800 rounded-xl border border-navy-700 bg-navy-850">
          {messages.map((m) => (
            <li
              key={m.id}
              onClick={() => !m.read && markRead(m.id)}
              className={clsx(
                "cursor-pointer px-4 py-3 text-sm",
                !m.read && "bg-navy-800/50"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={clsx("font-medium", m.read ? "text-ink-200" : "text-ink-100")}>
                  {m.name}
                </p>
                <span className="text-xs text-ink-500">
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                {[m.email, m.phone].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1.5 text-ink-300">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
