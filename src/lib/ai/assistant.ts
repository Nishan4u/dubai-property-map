import type Anthropic from "@anthropic-ai/sdk";
import {
  getCommunities,
  getProjectsForCommunity,
  searchProjectsForAssistant,
  getMarketInsights,
  getInvestmentAnalysisForProject,
  getMatchedProjectsForBuyer,
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

Your job: help visitors find and compare real projects listed on this platform, answer questions about specific Dubai communities/areas, reason through investment-relevant questions using real market data, give personalized matches to signed-in buyers, and answer general questions about buying property in Dubai (off-plan process, payment plans, escrow, handover, developer reputation in general terms, DLD fees, etc.).

Rules:
- When a visitor describes what they're looking for (location, budget, bedrooms, developer, property type, etc.), use the search_projects tool to find real matches. Never invent or guess project names, prices, or developers -- only mention projects the tool actually returns.
- When a visitor asks about a specific community/area (schools, metro, lifestyle, price levels, etc.), use the get_community_info tool. If it reports no free-text description on file, say so plainly rather than inventing lifestyle copy -- you can still share the real nearby-places and pricing data it returns.
- When a visitor asks "what's the market like" / "what's a typical price" in general or for an area, use get_market_insights.
- When a visitor asks whether a specific project (already found via search_projects) is a good investment, or how it compares, use get_investment_analysis with that project's slug. Reason from the real facts it returns (price vs. its own community's live market range, handover timeline, escrow account status, marketing tags). You are not a licensed financial, investment, mortgage, or legal advisor -- never guarantee returns or state a specific ROI/yield figure (this platform has no historical rental/resale data to compute one), and note that for anyone. For legal/tax advice or a firm recommendation, suggest speaking to a licensed broker or advisor via the platform.
- When a visitor asks for recommendations "for me" / personalized matches, use get_matched_projects. If it reports no signal, tell them to favorite a few projects first (and sign in, if they aren't).
- If a tool returns no matches, say so plainly and suggest broadening the search rather than fabricating a listing.
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

const MARKET_INSIGHTS_TOOL: Anthropic.Tool = {
  name: "get_market_insights",
  description:
    "Get real aggregate market stats from this platform's live listings -- price range/average, off-plan vs. ready split, common bedroom counts, top developers, and popular tags. Optionally scoped to one community. Use this for general 'what's the market like' or 'what's a typical price in X' questions. This is descriptive data from actual listings, not a computed ROI or investment return figure -- there is no historical rental/resale data on this platform.",
  input_schema: {
    type: "object",
    properties: {
      community: {
        type: "string",
        description: "Optional community/area name to scope the stats to. Omit for a Dubai-wide view across all live listings.",
      },
    },
  },
};

const INVESTMENT_ANALYSIS_TOOL: Anthropic.Tool = {
  name: "get_investment_analysis",
  description:
    "Get grounded investment-relevant facts about ONE specific project (found via search_projects first): its price positioned against real live market stats for its own community, handover timeline, escrow account protection status, and any 'high-roi'-style marketing tags the listing carries (clearly a marketing claim, not a computed return). Use this when a visitor asks 'is this a good investment' or 'how does this compare' about a specific project.",
  input_schema: {
    type: "object",
    properties: {
      projectSlug: {
        type: "string",
        description: "The project's slug, from a prior search_projects result's 'path' field (e.g. path '/projects/marina-vista' -> slug 'marina-vista').",
      },
    },
    required: ["projectSlug"],
  },
};

const MATCHED_PROJECTS_TOOL: Anthropic.Tool = {
  name: "get_matched_projects",
  description:
    "Get personalized project recommendations based on the signed-in visitor's own favorited projects on this platform. Only works for a logged-in buyer with at least one favorite -- if it reports no signal, tell the visitor to favorite a few projects first (or sign in, if they aren't). Use this when a visitor asks for recommendations/matches 'for me' rather than a fresh keyword search.",
  input_schema: { type: "object", properties: {} },
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

// buyerId is optional and resolved server-side from the caller's session
// (see the /api/assistant/chat route) -- guests keep working exactly as
// before with it undefined; only get_matched_projects actually needs it.
export async function* streamAssistantReply(history: ChatMessage[], buyerId?: string | null): AsyncGenerator<string> {
  let foundProjects: AssistantProjectResult[] = [];

  const loop = runToolLoop({
    systemPrompt: SYSTEM_PROMPT,
    tools: [SEARCH_PROJECTS_TOOL, COMMUNITY_INFO_TOOL, MARKET_INSIGHTS_TOOL, INVESTMENT_ANALYSIS_TOOL, MATCHED_PROJECTS_TOOL],
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
      if (name === "get_market_insights") {
        const community = typeof input.community === "string" ? input.community : undefined;
        return getMarketInsights(community);
      }
      if (name === "get_investment_analysis") {
        const slug = typeof input.projectSlug === "string" ? input.projectSlug.replace(/^\/projects\//, "") : "";
        return getInvestmentAnalysisForProject(slug);
      }
      if (name === "get_matched_projects") {
        if (!buyerId) {
          return {
            hasSignal: false,
            message: "This visitor isn't signed in -- personalized matching needs a logged-in buyer account with at least one favorited project.",
          };
        }
        const result = await getMatchedProjectsForBuyer(buyerId);
        if (result.hasSignal) foundProjects = result.projects;
        return result;
      }
      return { error: `Unknown tool: ${name}` };
    },
  });

  yield* loop;

  if (foundProjects.length) {
    yield `${PROJECTS_TRAILER_MARKER}${JSON.stringify(foundProjects)}`;
  }
}
