"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { PROJECTS_TRAILER_MARKER } from "@/lib/ai/shared";
import type { AssistantProjectResult } from "@/lib/supabase/queries";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Public-site only -- the portals (admin/developer/broker/broker-agency/
// salesperson/staff) get their own AI Broker/Sales Assistant as a separate,
// later master-plan module, not this buyer-facing one.
const HIDDEN_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/broker",
  "/broker-agency",
  "/salesperson",
  "/staff",
];

function formatPrice(aed: number): string {
  if (aed >= 1_000_000) return `AED ${(aed / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (aed >= 1_000) return `AED ${Math.round(aed / 1_000)}K`;
  return `AED ${aed}`;
}

export function AiChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<AssistantProjectResult[]>([]);
  // Non-null while the map is in (native or simulated) fullscreen -- the
  // element to portal this widget into so it stays visible and clickable
  // instead of getting stuck behind the fullscreened map. See the dispatch
  // site in HomeClient.tsx for why a DOM event carries this instead of
  // React context.
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onFullscreenChange(e: Event) {
      const detail = (e as CustomEvent<{ active: boolean; container: HTMLElement | null }>).detail;
      setFullscreenContainer(detail.active ? detail.container : null);
    }
    window.addEventListener("dpm:map-fullscreen", onFullscreenChange);
    return () => window.removeEventListener("dpm:map-fullscreen", onFullscreenChange);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (HIDDEN_PATH_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

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
      const res = await fetch("/api/assistant/chat", {
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

  // bottom-20, not bottom-4: DubaiMap's own Map/Satellite + fullscreen
  // controls live at "absolute bottom-4 right-4" *inside* the map, and the
  // map fills to the viewport's right edge on every page it appears on --
  // so a fixed bottom-4 right-4 widget sits exactly on top of them and
  // swallows their clicks. bottom-20 clears that ~40px-tall control row
  // with room to spare.
  const widget = !open ? (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open MapAI assistant"
      className="dpm-ai-glow fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-navy-950 shadow-2xl transition-transform hover:scale-105 hover:bg-gold-400"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  ) : (
    <div className="fixed bottom-20 right-4 z-50 flex h-[32rem] max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-navy-700 bg-navy-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-navy-700 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink-100">MapAI</p>
          <p className="text-xs text-ink-500">Ask about projects, communities, or buying off-plan</p>
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
        {messages.length === 0 && (
          <p className="text-sm text-ink-400">
            Hi! Tell me what you&apos;re looking for -- e.g. &quot;3-bedroom villas in Dubai
            Hills under 3M AED&quot; -- and I&apos;ll search real listings for you.
          </p>
        )}
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
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask a question…"
          aria-label="Message"
          className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none disabled:opacity-60"
        />
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
  );

  return fullscreenContainer ? createPortal(widget, fullscreenContainer) : widget;
}
