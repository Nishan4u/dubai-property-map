"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { PROJECTS_TRAILER_MARKER } from "@/lib/ai/shared";
import type { AssistantProjectResult } from "@/lib/supabase/queries";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function formatPrice(aed: number): string {
  if (aed >= 1_000_000) return `AED ${(aed / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (aed >= 1_000) return `AED ${Math.round(aed / 1_000)}K`;
  return `AED ${aed}`;
}

/**
 * Same streaming/message-list/input pattern as the public site's
 * AiChatWidget, generalized for the broker/salesperson portals: no
 * fullscreen-map edge case (portals don't have one), no path-based
 * hide/show (the caller mounts this only where it belongs, inside a
 * gated portal shell), auth handled entirely server-side by whatever
 * `apiPath` the caller points at.
 */
export function PortalAssistantWidget({
  apiPath,
  title,
  subtitle,
  placeholder,
  greeting,
}: {
  apiPath: string;
  title: string;
  subtitle: string;
  placeholder: string;
  greeting: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [projects, setProjects] = useState<AssistantProjectResult[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setProjects([]);

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      let displayText = "";
      let markerFound = false;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });

        if (!markerFound) {
          const markerIndex = raw.indexOf(PROJECTS_TRAILER_MARKER);
          if (markerIndex === -1) {
            displayText = raw;
          } else {
            displayText = raw.slice(0, markerIndex);
            markerFound = true;
          }
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: displayText };
            return copy;
          });
        }
      }

      if (markerFound) {
        const markerIndex = raw.indexOf(PROJECTS_TRAILER_MARKER);
        const jsonPart = raw.slice(markerIndex + PROJECTS_TRAILER_MARKER.length).trim();
        try {
          setProjects(JSON.parse(jsonPart));
        } catch {
          // Malformed trailer -- ignore, the text response already stands on its own.
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong -- please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={`Open ${title}`}
        className="dpm-ai-glow fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-white shadow-2xl transition-transform hover:scale-105 hover:bg-gold-400"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={clsx(
        "fixed bottom-4 right-4 z-50 h-[32rem] max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm rounded-xl",
        loading && "dpm-ai-border-glow"
      )}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-navy-700 bg-navy-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy-700 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink-100">{title}</p>
            <p className="text-xs text-ink-500">{subtitle}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="shrink-0 text-ink-500 hover:text-ink-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {messages.length === 0 && <p className="text-sm text-ink-400">{greeting}</p>}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-gold-500 px-3 py-2 text-sm text-navy-950"
                  : "mr-auto max-w-[85%] whitespace-pre-wrap rounded-lg rounded-bl-sm bg-navy-800 px-3 py-2 text-sm text-ink-100"
              }
            >
              {m.content || (loading && i === messages.length - 1 ? "…" : "")}
            </div>
          ))}
          {projects.length > 0 && (
            <div className="space-y-2">
              {projects.map((p) => (
                <Link
                  key={p.path}
                  href={p.path}
                  className="block rounded-lg border border-navy-700 bg-navy-850 p-2.5 text-xs hover:border-gold-500/60"
                >
                  <p className="font-semibold text-ink-100">{p.name}</p>
                  <p className="mt-0.5 text-ink-400">
                    {p.communityName} · {p.developerName} · {formatPrice(p.priceFromAed)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-navy-700 p-3">
          <div
            className={clsx(
              "relative flex-1 rounded-lg",
              inputFocused && !loading && "dpm-ai-border-glow"
            )}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              disabled={loading}
              placeholder={placeholder}
              aria-label="Message"
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500 text-navy-950 hover:bg-gold-400 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
