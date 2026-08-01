import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { searchProjectsForAssistant, type AssistantProjectResult } from "@/lib/supabase/queries";
import { getClient, isAssistantEnabled, DEFAULT_MODEL } from "@/lib/ai/core";

interface FavoriteProjectRow {
  slug: string;
  price_from_aed: number;
  bedrooms_from: number;
  bedrooms_to: number;
  property_type: string;
  communities: { name: string } | null;
}

function mostCommon(values: string[]): string | undefined {
  if (values.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

const BLURB_SYSTEM_PROMPT = `You're writing a short "why we think you'll like these" note for a Dubai Property Map user, based on real projects they've favorited and a short list of real candidate projects picked to match that pattern.

Rules:
- Base everything strictly on the JSON you're given (their favorites and the candidates) -- never invent a project, price, or fact not present in it.
- 2-3 short sentences, plain prose, no headers or lists -- this renders in a small panel above project cards that will be shown separately.
- You're not a licensed financial/investment advisor -- this is a discovery note, not a recommendation to buy.`;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: favRows } = await supabase
    .from("favorites")
    .select("projects(slug, price_from_aed, bedrooms_from, bedrooms_to, property_type, communities(name))")
    .eq("user_id", user.id);

  // Supabase's inferred type treats a to-one join as an array unless it
  // knows the FK is unique -- normalize the same way the rest of this file
  // already does (see the Array.isArray(row.developers) pattern above).
  const favoriteProjects: FavoriteProjectRow[] = (favRows ?? [])
    .map((r) => (Array.isArray(r.projects) ? r.projects[0] : r.projects))
    .filter((p) => p != null)
    .map((p) => ({
      slug: p.slug,
      price_from_aed: p.price_from_aed,
      bedrooms_from: p.bedrooms_from,
      bedrooms_to: p.bedrooms_to,
      property_type: p.property_type,
      communities: Array.isArray(p.communities) ? (p.communities[0] ?? null) : p.communities,
    }));

  if (favoriteProjects.length === 0) {
    return NextResponse.json({
      blurb: "Favorite a few projects and we'll suggest similar ones here.",
      projects: [],
    });
  }

  const favoritedPaths = new Set(favoriteProjects.map((p) => `/projects/${p.slug}`));
  const prices = favoriteProjects.map((p) => p.price_from_aed).filter((p) => p > 0);
  const bedroomsFrom = favoriteProjects.map((p) => p.bedrooms_from);
  const bedroomsTo = favoriteProjects.map((p) => p.bedrooms_to);
  const community = mostCommon(favoriteProjects.map((p) => p.communities?.name).filter((n): n is string => !!n));
  const propertyType = mostCommon(favoriteProjects.map((p) => p.property_type));
  const priceMaxAed = prices.length ? Math.max(...prices) * 1.3 : undefined;
  const bedroomsMin = bedroomsFrom.length ? Math.min(...bedroomsFrom) : undefined;
  const bedroomsMax = bedroomsTo.length ? Math.max(...bedroomsTo) : undefined;

  const candidates = await searchProjectsForAssistant({
    community,
    propertyType,
    priceMaxAed,
    bedroomsMin,
    bedroomsMax,
    limit: 8,
  });
  const filtered = candidates.filter((c) => !favoritedPaths.has(c.path)).slice(0, 4);

  if (filtered.length === 0) {
    return NextResponse.json({
      blurb: "No new matches for your favorites right now -- check back as more projects are added.",
      projects: [],
    });
  }

  if (!isAssistantEnabled()) {
    return NextResponse.json({
      blurb: "Here's what's similar to your favorites.",
      projects: filtered,
    });
  }

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 200,
      system: BLURB_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            favorites: favoriteProjects.map((p) => ({
              community: p.communities?.name,
              propertyType: p.property_type,
              priceFromAed: p.price_from_aed,
            })),
            candidates: filtered,
          }),
        },
      ],
    });
    const blurb = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return NextResponse.json({ blurb: blurb || "Here's what's similar to your favorites.", projects: filtered });
  } catch {
    return NextResponse.json({ blurb: "Here's what's similar to your favorites.", projects: filtered });
  }
}

export type RecommendationsResponse = { blurb: string; projects: AssistantProjectResult[] };
