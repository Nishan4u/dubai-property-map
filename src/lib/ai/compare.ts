import { getClient, isAssistantEnabled, DEFAULT_MODEL } from "@/lib/ai/core";

export interface CompareProject {
  name: string;
  developer: string;
  community: string;
  priceFromAed: number;
  bedroomsFrom: number;
  bedroomsTo: number;
  paymentPlan: string;
  propertyType: string;
  handoverQuarter: string | null;
  handoverYear: number | null;
  rating: number | null;
  amenityCount: number;
}

// One-shot, non-conversational: the caller (/compare) already has full,
// real project data client-side, so this just asks the model to summarize
// differences over that data -- no tool-calling loop needed, unlike the
// chat assistants.
const SYSTEM_PROMPT = `You're writing a short comparison summary for a Dubai Property Map site visitor who has selected a few real estate projects to compare.

You'll receive a JSON array of the selected projects with their real facts (developer, community, starting price, bedroom range, payment plan, property type, handover, rating, amenity count).

Rules:
- Base everything strictly on the JSON you're given -- never invent a fact, price, or detail not present in it.
- In 3-5 short sentences, highlight genuine differences between the projects and note which might suit which kind of buyer (e.g. budget-conscious vs. luxury, family vs. investor) based only on the given data.
- You're not a licensed financial/investment advisor -- this is a factual comparison, not a recommendation to buy.
- Plain prose, no headers or bullet lists -- this renders in a small panel.`;

export async function* streamComparisonSummary(projects: CompareProject[]): AsyncGenerator<string> {
  if (!isAssistantEnabled()) {
    yield "AI comparison isn't set up yet -- please compare the table above manually for now.";
    return;
  }

  const client = getClient();
  const stream = client.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(projects) }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}
