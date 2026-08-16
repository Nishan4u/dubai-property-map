import type Anthropic from "@anthropic-ai/sdk";
import { getClient, isAssistantEnabled } from "@/lib/ai/core";

// Accuracy-critical, one-shot document read -- deliberately NOT the
// lighter conversational DEFAULT_MODEL (Haiku 4.5) that MapAI/the
// portal assistants use. Misreading a price or bedroom count here
// defeats the whole point of the feature.
const EXTRACTION_MODEL = "claude-sonnet-5";

export interface ExtractedField<T> {
  value: T | null;
  confidence: number; // 0-100. 0 when the document genuinely doesn't state it.
}

export interface ProjectExtractionResult {
  fields: {
    name: ExtractedField<string>;
    description: ExtractedField<string>;
    communityNameGuess: ExtractedField<string>;
    propertyType: ExtractedField<string>;
    listingType: ExtractedField<"off-plan" | "ready">;
    priceFromAed: ExtractedField<number>;
    paymentPlan: ExtractedField<string>;
    bedroomsFrom: ExtractedField<number>;
    bedroomsTo: ExtractedField<number>;
    handoverQuarter: ExtractedField<string>;
    handoverYear: ExtractedField<number>;
    launchDate: ExtractedField<string>;
    amenities: ExtractedField<string[]>;
    tags: ExtractedField<string[]>;
    videoUrl: ExtractedField<string>;
    virtualTourUrl: ExtractedField<string>;
    dldPermitNumber: ExtractedField<string>;
    trakheesiNumber: ExtractedField<string>;
    madmounQrUrl: ExtractedField<string>;
  };
  overallConfidence: number;
  model: string;
}

const FIELD_SCHEMA = (valueType: unknown, description: string) => ({
  type: "object" as const,
  description,
  properties: {
    value: valueType,
    confidence: {
      type: "number",
      description: "0-100. Use 0 when the document genuinely doesn't state this -- never guess a value just to raise this number.",
    },
  },
  required: ["value", "confidence"],
});

const NULLABLE_STRING = { type: ["string", "null"] as const };
const NULLABLE_NUMBER = { type: ["number", "null"] as const };

function buildTool(propertyTypes: string[], amenityOptions: string[]): Anthropic.Tool {
  return {
    name: "extract_project_data",
    description:
      "Record every fact this brochure/document actually states about the development, one entry per field, each paired with your confidence (0-100). Never invent a value that isn't genuinely stated or clearly implied by the document -- when a field is absent, return value: null and confidence: 0.",
    input_schema: {
      type: "object",
      properties: {
        name: FIELD_SCHEMA(NULLABLE_STRING, "The project/development's real name as printed in the document."),
        description: FIELD_SCHEMA(NULLABLE_STRING, "A factual 2-4 sentence summary built only from what the document states -- never invented marketing copy."),
        communityNameGuess: FIELD_SCHEMA(
          NULLABLE_STRING,
          "The community/area name as the document states it (e.g. 'Dubai Marina', 'Business Bay') -- raw text, do not guess an id, this gets matched against real communities separately."
        ),
        propertyType: FIELD_SCHEMA(
          { type: ["string", "null"], description: `One of the platform's real property types if it clearly matches: ${propertyTypes.join(", ")}. Otherwise the type as stated.` },
          "Property type (apartment, villa, townhouse, etc.)."
        ),
        listingType: FIELD_SCHEMA(
          { type: ["string", "null"], enum: ["off-plan", "ready", null] },
          "'off-plan' for a pre-completion launch (the near-universal case for a developer brochure), 'ready' only if the document is clearly about already-completed/handed-over units."
        ),
        priceFromAed: FIELD_SCHEMA(NULLABLE_NUMBER, "Starting price in AED, as a plain number (no currency symbol/commas). Convert from another currency only if the document itself states the AED equivalent."),
        paymentPlan: FIELD_SCHEMA(NULLABLE_STRING, "The payment plan structure as a short label, e.g. '20/80', '1% Monthly', '60/40' -- however the document actually describes it."),
        bedroomsFrom: FIELD_SCHEMA(NULLABLE_NUMBER, "Smallest bedroom count offered (0 for studio)."),
        bedroomsTo: FIELD_SCHEMA(NULLABLE_NUMBER, "Largest bedroom count offered."),
        handoverQuarter: FIELD_SCHEMA({ type: ["string", "null"], enum: ["Q1", "Q2", "Q3", "Q4", null] }, "Expected handover quarter, if stated."),
        handoverYear: FIELD_SCHEMA(NULLABLE_NUMBER, "Expected handover year, if stated."),
        launchDate: FIELD_SCHEMA({ type: ["string", "null"], description: "ISO date (YYYY-MM-DD) if a specific launch date is stated." }, "Launch date."),
        amenities: FIELD_SCHEMA(
          { type: ["array", "null"], items: { type: "string" }, description: `Only amenities genuinely stated in the document, matched to this platform's real amenity list where a clear match exists: ${amenityOptions.join(", ")}. Do not invent amenities.` },
          "Amenities list."
        ),
        tags: FIELD_SCHEMA(
          { type: ["array", "null"], items: { type: "string", enum: ["new-launch", "luxury", "waterfront", "villas", "under-1m", "high-roi"] }, description: "Only tags clearly justified by the document's own content -- e.g. 'waterfront' only if the document describes a waterfront location." },
          "Marketing tags from this fixed set only."
        ),
        videoUrl: FIELD_SCHEMA(NULLABLE_STRING, "A project video URL, only if one is literally printed in the document."),
        virtualTourUrl: FIELD_SCHEMA(NULLABLE_STRING, "A virtual tour URL, only if one is literally printed in the document."),
        dldPermitNumber: FIELD_SCHEMA(NULLABLE_STRING, "DLD permit / advertisement permit number, only if explicitly printed."),
        trakheesiNumber: FIELD_SCHEMA(NULLABLE_STRING, "Trakheesi number, only if explicitly printed."),
        madmounQrUrl: FIELD_SCHEMA(NULLABLE_STRING, "Madmoun QR/verification URL, only if explicitly printed."),
      },
      required: [
        "name", "description", "communityNameGuess", "propertyType", "listingType",
        "priceFromAed", "paymentPlan", "bedroomsFrom", "bedroomsTo", "handoverQuarter",
        "handoverYear", "launchDate", "amenities", "tags", "videoUrl", "virtualTourUrl",
        "dldPermitNumber", "trakheesiNumber", "madmounQrUrl",
      ],
    },
  };
}

/**
 * Reads a developer-uploaded brochure/document (PDF) and drafts structured
 * project data via Claude's document understanding, one confidence score
 * per field. Deliberately a single non-streaming, tool-forced call rather
 * than routed through runToolLoop -- this isn't a multi-turn conversation,
 * it's one extraction pass with no side-effecting tools to dispatch.
 *
 * Never fabricates: the tool description and this function's own system
 * prompt both explicitly instruct null + confidence 0 for anything the
 * document doesn't actually state, matching this codebase's established
 * "never guess a market fact" discipline (see patch_91's own header
 * comment for the precedent this follows).
 */
export async function extractProjectFromDocument({
  base64Pdf,
  fileName,
  propertyTypes,
  amenityOptions,
}: {
  base64Pdf: string;
  fileName: string;
  propertyTypes: string[];
  amenityOptions: string[];
}): Promise<ProjectExtractionResult> {
  if (!isAssistantEnabled()) {
    throw new Error("AI extraction isn't configured (ANTHROPIC_API_KEY not set).");
  }

  const client = getClient();
  const tool = buildTool(propertyTypes, amenityOptions);

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 4096,
    system:
      "You are reading a Dubai real-estate developer's project brochure/document to help populate a listing draft that a human will review before it goes live. Extract only what the document actually states. Call extract_project_data exactly once with your findings.",
    tools: [tool],
    tool_choice: { type: "tool", name: "extract_project_data" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64Pdf },
            title: fileName,
          },
          {
            type: "text",
            text: "Extract this development's project data per the extract_project_data tool's schema.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("The model didn't return structured extraction data.");
  }

  const fields = toolUse.input as ProjectExtractionResult["fields"];
  const confidences = Object.values(fields)
    .map((f) => (f && typeof f === "object" && "confidence" in f ? (f as ExtractedField<unknown>).confidence : null))
    .filter((c): c is number => typeof c === "number");
  const overallConfidence =
    confidences.length > 0 ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;

  return { fields, overallConfidence, model: EXTRACTION_MODEL };
}
