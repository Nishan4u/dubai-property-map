import type Anthropic from "@anthropic-ai/sdk";
import {
  getPropertyRequestsForBroker,
  searchProjectsForAssistant,
  type AssistantProjectResult,
} from "@/lib/supabase/queries";
import { PROJECTS_TRAILER_MARKER } from "@/lib/ai/shared";
import { runToolLoop, type ChatMessage } from "@/lib/ai/core";

export type { ChatMessage } from "@/lib/ai/core";
export { isAssistantEnabled } from "@/lib/ai/core";

const SYSTEM_PROMPT = `You are the Broker Assistant on Dubai Property Map (dubaipropertymap.ae), helping a logged-in broker do their job faster.

Your job: search real listed projects on the platform for the broker's clients, and summarize the broker's own property requests (their pipeline) by status.

Rules:
- Brokers see every project on the platform -- use search_projects freely, never invent project names, prices, or developers.
- Property requests never contain a client's name, phone, or email (this platform deliberately never collects that) -- only requirement details (budget, bedrooms, property type, status, matched project/developer if any). Never imply you know who the client is; refer to requests by their request ID or requirement summary.
- Use get_my_property_requests to answer questions about the broker's own pipeline (e.g. "what's still open", "how many have I closed").
- You are not a licensed financial, investment, mortgage, or legal advisor -- decline politely and point to a licensed advisor for that.
- Keep responses concise and conversational, suited to a chat widget.`;

const SEARCH_PROJECTS_TOOL: Anthropic.Tool = {
  name: "search_projects",
  description:
    "Search Dubai Property Map's live listings for real off-plan/ready projects matching a client's criteria. Always use this instead of naming projects from memory.",
  input_schema: {
    type: "object",
    properties: {
      community: { type: "string", description: "Community or area name (partial match is fine)" },
      developer: { type: "string", description: "Developer name (partial match is fine)" },
      propertyType: { type: "string", description: "e.g. 'Apartment', 'Villa', 'Townhouse'" },
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
      listingType: { type: "string", enum: ["buy", "rent", "off-plan", "ready"] },
    },
  },
};

const MY_PROPERTY_REQUESTS_TOOL: Anthropic.Tool = {
  name: "get_my_property_requests",
  description:
    "List the broker's own property requests (their pipeline), optionally filtered by status. Never returns client names/contact details -- those aren't collected by this platform.",
  input_schema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: [
          "new",
          "broker_contacted",
          "requirement_confirmed",
          "units_shared",
          "viewing_scheduled",
          "negotiation",
          "booking",
          "closed_won",
          "on_hold",
          "lost",
          "cancelled",
        ],
        description: "Omit to get every request regardless of status.",
      },
    },
  },
};

export async function* streamBrokerAssistantReply(
  history: ChatMessage[],
  brokerId: string
): AsyncGenerator<string> {
  let foundProjects: AssistantProjectResult[] = [];

  const loop = runToolLoop({
    systemPrompt: SYSTEM_PROMPT,
    tools: [SEARCH_PROJECTS_TOOL, MY_PROPERTY_REQUESTS_TOOL],
    history,
    dispatchTool: async (name, input) => {
      if (name === "search_projects") {
        const results = await searchProjectsForAssistant(input);
        foundProjects = results;
        return results;
      }
      if (name === "get_my_property_requests") {
        const status = typeof input.status === "string" ? input.status : undefined;
        const requests = await getPropertyRequestsForBroker(brokerId, status);
        // Lean, non-identifying shape -- no client info exists to leak, but
        // trim the row down anyway rather than handing raw DB rows to the model.
        return requests.map((r) => ({
          requestId: r.request_id,
          status: r.status,
          propertyType: r.property_type,
          bedrooms: r.bedrooms,
          budgetMinAed: r.budget_min,
          budgetMaxAed: r.budget_max,
          projectName: r.projects?.name ?? null,
          developerName: r.developers?.name ?? null,
          createdAt: r.created_at,
        }));
      }
      return { error: `Unknown tool: ${name}` };
    },
  });

  yield* loop;

  if (foundProjects.length) {
    yield `${PROJECTS_TRAILER_MARKER}${JSON.stringify(foundProjects)}`;
  }
}
