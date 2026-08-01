import type Anthropic from "@anthropic-ai/sdk";
import {
  getPropertyRequestsForSalesperson,
  searchProjectsForAssistant,
  type AssistantProjectResult,
} from "@/lib/supabase/queries";
import { PROJECTS_TRAILER_MARKER } from "@/lib/ai/shared";
import { runToolLoop, type ChatMessage } from "@/lib/ai/core";

export type { ChatMessage } from "@/lib/ai/core";
export { isAssistantEnabled } from "@/lib/ai/core";

const SYSTEM_PROMPT = `You are the Sales Assistant on Dubai Property Map (dubaipropertymap.ae), helping a logged-in salesperson do their job faster.

Your job: search real listed projects from the salesperson's own assigned developer, and summarize the salesperson's own leads (property requests routed to them) by status.

Rules:
- You can only search and discuss projects from the salesperson's own assigned developer -- search_projects is already scoped to that developer, so just use it normally; never claim to know about other developers' projects.
- Property requests never contain a client's name, phone, or email (this platform deliberately never collects that) -- only requirement details and the broker who submitted it. Never imply you know a client's identity.
- Use get_my_leads to answer questions about the salesperson's own pipeline (e.g. "what's still open", "how many have I closed").
- You are not a licensed financial, investment, mortgage, or legal advisor -- decline politely and point to a licensed advisor for that.
- Keep responses concise and conversational, suited to a chat widget.`;

const SEARCH_PROJECTS_TOOL: Anthropic.Tool = {
  name: "search_projects",
  description:
    "Search your assigned developer's live listings on Dubai Property Map. Always use this instead of naming projects from memory.",
  input_schema: {
    type: "object",
    properties: {
      community: { type: "string", description: "Community or area name (partial match is fine)" },
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

const MY_LEADS_TOOL: Anthropic.Tool = {
  name: "get_my_leads",
  description:
    "List the salesperson's own leads (property requests routed to them), optionally filtered by status. Never returns client names/contact details -- those aren't collected by this platform.",
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
        description: "Omit to get every lead regardless of status.",
      },
    },
  },
};

export async function* streamSalespersonAssistantReply(
  history: ChatMessage[],
  salespersonId: string,
  developerId: string
): AsyncGenerator<string> {
  let foundProjects: AssistantProjectResult[] = [];

  const loop = runToolLoop({
    systemPrompt: SYSTEM_PROMPT,
    tools: [SEARCH_PROJECTS_TOOL, MY_LEADS_TOOL],
    history,
    dispatchTool: async (name, input) => {
      if (name === "search_projects") {
        // developerId is derived server-side from the verified session, not
        // the model -- this is what actually enforces "salesperson only
        // sees their assigned developer's projects."
        const results = await searchProjectsForAssistant({ ...input, developerId });
        foundProjects = results;
        return results;
      }
      if (name === "get_my_leads") {
        const status = typeof input.status === "string" ? input.status : undefined;
        const leads = await getPropertyRequestsForSalesperson(salespersonId, status);
        return leads.map((l) => ({
          requestId: l.request_id,
          status: l.status,
          propertyType: l.property_type,
          bedrooms: l.bedrooms,
          budgetMinAed: l.budget_min,
          budgetMaxAed: l.budget_max,
          projectName: l.projects?.name ?? null,
          brokerName: l.brokers?.full_name ?? null,
          createdAt: l.created_at,
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
