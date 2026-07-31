import Anthropic from "@anthropic-ai/sdk";
import {
  searchProjectsForAssistant,
  type AssistantProjectResult,
} from "@/lib/supabase/queries";
import { PROJECTS_TRAILER_MARKER } from "@/lib/ai/shared";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Keeps the assistant grounded to what it can actually verify (real listed
// projects via the search tool) and out of licensed-advice territory --
// this is a property discovery tool, not a financial/legal advisor.
const SYSTEM_PROMPT = `You are the AI assistant for Dubai Property Map (dubaipropertymap.ae), a platform for exploring off-plan and ready real estate projects in Dubai.

Your job: help visitors find and compare real projects listed on this platform, and answer general questions about buying property in Dubai (off-plan process, payment plans, escrow, handover, developer reputation in general terms, DLD fees, etc.).

Rules:
- When a visitor describes what they're looking for (location, budget, bedrooms, developer, property type, etc.), use the search_projects tool to find real matches. Never invent or guess project names, prices, or developers -- only mention projects the tool actually returns.
- If the tool returns no matches, say so plainly and suggest broadening the search rather than fabricating a listing.
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

export function isAssistantEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const MAX_TOOL_TURNS = 4;

export async function* streamAssistantReply(
  history: ChatMessage[]
): AsyncGenerator<string> {
  if (!isAssistantEnabled()) {
    yield "The AI assistant isn't set up yet -- please reach out through the site for help in the meantime.";
    return;
  }

  const client = getClient();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let foundProjects: AssistantProjectResult[] = [];

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const stream = client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [SEARCH_PROJECTS_TOOL],
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }

    const final = await stream.finalMessage();
    messages.push({ role: "assistant", content: final.content });

    if (final.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of final.content) {
      if (block.type !== "tool_use" || block.name !== "search_projects") continue;
      try {
        const results = await searchProjectsForAssistant(
          (block.input ?? {}) as Record<string, unknown>
        );
        foundProjects = results;
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(results),
        });
      } catch {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: "Search failed -- tell the visitor you're having trouble searching right now.",
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  if (foundProjects.length) {
    yield `${PROJECTS_TRAILER_MARKER}${JSON.stringify(foundProjects)}`;
  }
}
