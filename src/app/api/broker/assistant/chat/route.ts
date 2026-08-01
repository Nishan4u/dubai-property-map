import { NextRequest, NextResponse } from "next/server";
import { streamBrokerAssistantReply } from "@/lib/ai/brokerAssistant";
import { isRateLimited } from "@/lib/ai/rateLimit";
import { isValidMessages } from "@/lib/ai/shared";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("broker_id")
    .eq("id", user.id)
    .single();
  if (!profile?.broker_id) {
    return NextResponse.json({ error: "No broker account found." }, { status: 400 });
  }

  // Re-check account status server-side -- mirrors src/app/broker/layout.tsx's
  // gate. A suspended/pending broker could otherwise still reach this route
  // directly even though the portal UI blocks them.
  const { data: broker } = await supabase
    .from("brokers")
    .select("account_status")
    .eq("id", profile.broker_id)
    .single();
  if (broker?.account_status !== "approved") {
    return NextResponse.json({ error: "Broker account not approved." }, { status: 403 });
  }

  // Soft per-user cost cap -- the real security boundary is the auth/status
  // check above, not this (see rateLimit.ts's own comment).
  if (isRateLimited(user.id)) {
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

  const brokerId = profile.broker_id;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamBrokerAssistantReply(messages, brokerId)) {
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
