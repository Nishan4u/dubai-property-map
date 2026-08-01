import { NextRequest, NextResponse } from "next/server";
import { streamSalespersonAssistantReply } from "@/lib/ai/salespersonAssistant";
import { isRateLimited } from "@/lib/ai/rateLimit";
import { isValidMessages } from "@/lib/ai/shared";
import { createClient } from "@/lib/supabase/server";
import { getSalespersonDeveloperAccess } from "@/lib/supabase/queries";

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
    .select("salesperson_id")
    .eq("id", user.id)
    .single();
  if (!profile?.salesperson_id) {
    return NextResponse.json({ error: "No salesperson account found." }, { status: 400 });
  }

  const { data: salesperson } = await supabase
    .from("salespersons")
    .select("status")
    .eq("id", profile.salesperson_id)
    .single();
  if (salesperson?.status === "inactive") {
    return NextResponse.json({ error: "Salesperson account inactive." }, { status: 403 });
  }

  // Mirrors src/app/salesperson/layout.tsx's gate: resolves the assigned
  // developer and checks the developer's own status/subscription is clean.
  const { developerId, blocked } = await getSalespersonDeveloperAccess();
  if (!developerId || blocked) {
    return NextResponse.json({ error: "Developer access unavailable." }, { status: 403 });
  }

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

  const salespersonId = profile.salesperson_id;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamSalespersonAssistantReply(messages, salespersonId, developerId)) {
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
