import { NextRequest, NextResponse } from "next/server";
import { streamComparisonSummary, type CompareProject } from "@/lib/ai/compare";
import { isRateLimited } from "@/lib/ai/rateLimit";

const MIN_PROJECTS = 2;
const MAX_PROJECTS = 5;

function isValidProjects(value: unknown): value is CompareProject[] {
  return (
    Array.isArray(value) &&
    value.length >= MIN_PROJECTS &&
    value.length <= MAX_PROJECTS &&
    value.every(
      (p) =>
        p &&
        typeof p === "object" &&
        typeof p.name === "string" &&
        p.name.length > 0 &&
        typeof p.developer === "string" &&
        typeof p.community === "string" &&
        typeof p.priceFromAed === "number" &&
        typeof p.bedroomsFrom === "number" &&
        typeof p.bedroomsTo === "number" &&
        typeof p.paymentPlan === "string" &&
        typeof p.propertyType === "string" &&
        (p.handoverQuarter === null || typeof p.handoverQuarter === "string") &&
        (p.handoverYear === null || typeof p.handoverYear === "number") &&
        (p.rating === null || typeof p.rating === "number") &&
        typeof p.amenityCount === "number"
    )
  );
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "You've made a lot of requests -- please wait a bit before trying again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const projects = (body as { projects?: unknown })?.projects;
  if (!isValidProjects(projects)) {
    return NextResponse.json(
      { error: `Select between ${MIN_PROJECTS} and ${MAX_PROJECTS} projects to compare.` },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamComparisonSummary(projects)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        controller.enqueue(
          encoder.encode("Something went wrong on our end -- please try again shortly.")
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
