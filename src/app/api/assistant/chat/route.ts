import { NextRequest, NextResponse } from "next/server";
import { streamAssistantReply } from "@/lib/ai/assistant";
import { isRateLimited } from "@/lib/ai/rateLimit";
import { isValidMessages } from "@/lib/ai/shared";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Soft/optional -- MapAI is used by signed-out guests too, so this must
  // never gate the route. Only get_matched_projects (personalized
  // recommendations) actually needs a buyer id; everything else works
  // identically whether this resolves or not.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const buyerId = user?.id ?? null;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "You've sent a lot of messages -- please wait a bit before trying again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!isValidMessages(messages)) {
    return NextResponse.json({ error: "Invalid message history." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamAssistantReply(messages, buyerId)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        controller.enqueue(
          encoder.encode("\n\nSomething went wrong on our end -- please try again shortly.")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
