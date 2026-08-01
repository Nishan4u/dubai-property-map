import type Anthropic from "@anthropic-ai/sdk";
import {
  getCommunities,
  getProjectsForCommunity,
  searchProjectsForAssistant,
  type AssistantProjectResult,
} from "@/lib/supabase/queries";
import { PROJECTS_TRAILER_MARKER } from "@/lib/ai/shared";
import { runToolLoop, type ChatMessage } from "@/lib/ai/core";
import { poiLayers } from "@/data/poi";
import { nearestPoints } from "@/lib/nearbyPoi";

export type { ChatMessage } from "@/lib/ai/core";
export { isAssistantEnabled } from "@/lib/ai/core";

// Keeps the assistant grounded to what it can actually verify (real listed
// projects via the search tool) and out of licensed-advice territory --
// this is a property discovery tool, not a financial/legal advisor.
const SYSTEM_PROMPT = `You are MapAI, the AI assistant for Dubai Property Map (dubaipropertymap.ae), a platform for exploring off-plan and ready real estate projects in Dubai.

Your job: help visitors find and compare real projects listed on this platform, answer questions about specific Dubai communities/areas, and answer general questions about buying property in Dubai (off-plan process, payment plans, escrow, handover, developer reputation in general terms, DLD fees, etc.).

Rules:
- When a visitor describes what they're looking for (location, budget, bedrooms, developer, property type, etc.), use the search_projects tool to find real matches. Never invent or guess project names, prices, or developers -- only mention projects the tool actually returns.
- When a visitor asks about a specific community/area (schools, metro, lifestyle, price levels, etc.), use the get_community_info tool. If it reports no free-text description on file, say so plainly rather than inventing lifestyle copy -- you can still share the real nearby-places and pricing data it returns.
- If a tool returns no matches, say so plainly and suggest broadening the search rather than fabricating a listing.
- You are not a licensed financial, investment, mortgage, or legal advisor. Decline politely and suggest speaking to a licensed broker or advisor via the platform when asked for investment recommendations, guarantees of returns, or legal/tax advice -- you can still share general, well-known public information about how off-plan buying works in Dubai.
- Keep responses concise and conversational, suited to a chat widget -- short paragraphs, no long essays.`;

const SEARCH_PROJECTS_TOOL: Anthropic.Tool = {
  name: "search_projects",
  description:
    "Search Dubai Property Map's live listings for real off-plan/ready projects matching the visitor's criteria. Always use this instead of naming projects from memory -- only projects this tool returns are real and currently listed.",
  input_schema: {
    type: "object",
    properties: {
      community: {
        type: "string",
        description: "Community or area name, e.g. 'Dubai Marina' (partial match is fine)",
      },
      developer: {
        type: "string",
        description: "Developer name, e.g. 'Emaar' (partial match is fine)",
      },
      propertyType: {
        type: "string",
        description: "e.g. 'Apartment', 'Villa', 'Townhouse'",
      },
      bedroomsMin: { type: "number" },
      bedroomsMax: { type: "number" },
      priceMaxAed: { type: "number", description: "Maximum starting price in AED" },
      tags: {
        type: "array",
        items: {
          type: "string",
          enum: ["new-launch", "luxury", "waterfront", "villas", "under-1m", "high-roi"],
        },
      },
      listingType: {
        type: "string",
        enum: ["buy", "rent", "off-plan", "ready"],
      },
    },
  },
};

const COMMUNITY_INFO_TOOL: Anthropic.Tool = {
  name: "get_community_info",
  description:
    "Look up real facts about a specific Dubai community/area: how many projects are live on this platform there and their price range, plus real nearby schools, hospitals, metro stations, beaches/parks/golf/malls, restaurants and attractions. Use this when the visitor asks about a specific area rather than searching for projects.",
  input_schema: {
    type: "object",
    properties: {
      community: {
        type: "string",
        description: "Community or area name, e.g. 'Dubai Marina' (partial match is fine)",
      },
    },
    required: ["community"],
  },
};

function poiPoints(key: string) {
  return poiLayers.find((l) => l.key === key)?.points ?? [];
}

async function getCommunityInfo(input: Record<string, unknown>) {
  const query = typeof input.community === "string" ? input.community.trim().toLowerCase() : "";
  if (!query) return { found: false, message: "No community name given." };

  const communities = await getCommunities();
  const match =
    communities.find((c) => c.name.toLowerCase().includes(query)) ??
    communities.find((c) => query.includes(c.name.toLowerCase()));

  if (!match) {
    return { found: false, message: `No community named "${input.community}" found on this platform.` };
  }

  const projectRows = await getProjectsForCommunity(match.id);
  const prices = projectRows.map((p) => p.price_from_aed).filter((p) => p > 0);
  const priceRangeAed = prices.length
    ? { minAed: Math.min(...prices), maxAed: Math.max(...prices) }
    : null;

  const origin = match.lat != null && match.lng != null ? { lat: match.lat, lng: match.lng } : null;
  const nearby = origin
    ? {
        schools: nearestPoints(origin, poiPoints("schools"), 3).map((p) => p.name),
        hospitals: nearestPoints(origin, poiPoints("hospitals"), 3).map((p) => p.name),
        metro: nearestPoints(origin, poiPoints("metro"), 3).map((p) => p.name),
        lifestyle: nearestPoints(
          origin,
          [...poiPoints("beaches"), ...poiPoints("golf"), ...poiPoints("parks"), ...poiPoints("malls")],
          3
        ).map((p) => p.name),
        restaurants: nearestPoints(origin, poiPoints("restaurants"), 3).map((p) => p.name),
        attractions: nearestPoints(origin, poiPoints("attractions"), 3).map((p) => p.name),
      }
    : null;

  return {
    found: true,
    name: match.name,
    hasDescription: !!match.description,
    description: match.description,
    liveProjectCount: projectRows.length,
    priceRangeAed,
    nearby,
  };
}

export async function* streamAssistantReply(history: ChatMessage[]): AsyncGenerator<string> {
  let foundProjects: AssistantProjectResult[] = [];

  const loop = runToolLoop({
    systemPrompt: SYSTEM_PROMPT,
    tools: [SEARCH_PROJECTS_TOOL, COMMUNITY_INFO_TOOL],
    history,
    dispatchTool: async (name, input) => {
      if (name === "search_projects") {
        const results = await searchProjectsForAssistant(input);
        foundProjects = results;
        return results;
      }
      if (name === "get_community_info") {
        return getCommunityInfo(input);
      }
      return { error: `Unknown tool: ${name}` };
    },
  });

  yield* loop;

  if (foundProjects.length) {
    yield `${PROJECTS_TRAILER_MARKER}${JSON.stringify(foundProjects)}`;
  }
}
