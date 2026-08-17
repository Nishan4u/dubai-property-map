import { Sparkles } from "lucide-react";

interface ExtractedFieldValue {
  value: unknown;
  confidence: number;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Project Name",
  description: "Description",
  communityNameGuess: "Community",
  propertyType: "Property Type",
  listingType: "Listing Type",
  priceFromAed: "Starting Price",
  paymentPlan: "Payment Plan",
  bedroomsFrom: "Bedrooms (from)",
  bedroomsTo: "Bedrooms (to)",
  handoverQuarter: "Handover Quarter",
  handoverYear: "Handover Year",
  launchDate: "Launch Date",
  amenities: "Amenities",
  tags: "Tags",
  videoUrl: "Video URL",
  virtualTourUrl: "Virtual Tour URL",
  dldPermitNumber: "DLD Permit Number",
  trakheesiNumber: "Trakheesi Number",
  madmounQrUrl: "Madmoun QR URL",
};

const LOW_CONFIDENCE_THRESHOLD = 75;

/**
 * Sits above ProjectForm (never touches its internals) when a project was
 * created via AI -- either Upload Brochure -> AI Draft Project (patch_149,
 * source_type "brochure_upload") or AI Project Discovery's own web
 * research (patch_150, source_type "web_discovery"). Summarizes
 * confidence and calls out specifically which fields are worth
 * double-checking before publishing.
 */
export function AiExtractionBanner({
  extraction,
}: {
  extraction: {
    source_file_name: string;
    source_file_url: string | null;
    source_type?: "brochure_upload" | "web_discovery";
    source_urls?: string[];
    extracted_fields: Record<string, ExtractedFieldValue>;
    overall_confidence: number | null;
  };
}) {
  const fieldsToCheck = Object.entries(extraction.extracted_fields ?? {})
    .filter(([, f]) => f?.value !== null && typeof f?.confidence === "number" && f.confidence < LOW_CONFIDENCE_THRESHOLD)
    .map(([key, f]) => ({ label: FIELD_LABELS[key] ?? key, confidence: f.confidence }));

  const isWebDiscovery = extraction.source_type === "web_discovery";

  return (
    <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-4">
      <div className="flex items-center gap-2 text-gold-400">
        <Sparkles className="h-4 w-4" />
        <p className="text-sm font-semibold">
          {isWebDiscovery ? "Created from AI web research" : "Created from an AI-read brochure"}
        </p>
      </div>
      {isWebDiscovery ? (
        <p className="mt-1 text-xs text-ink-400">
          This draft was compiled from public web sources ({extraction.overall_confidence ?? 0}% overall confidence).
          Please review every field before publishing -- this was not submitted by the developer and has not been
          verified against DLD records.
          {extraction.source_urls && extraction.source_urls.length > 0 && (
            <span className="mt-1 block space-y-0.5">
              {extraction.source_urls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-gold-400 hover:text-gold-300"
                >
                  {url} →
                </a>
              ))}
            </span>
          )}
        </p>
      ) : (
        <p className="mt-1 text-xs text-ink-400">
          This draft was auto-filled from <span className="text-ink-300">{extraction.source_file_name}</span>{" "}
          ({extraction.overall_confidence ?? 0}% overall confidence). Please review every field before publishing --
          AI can misread a brochure, especially prices, dates, and the community match.
          {extraction.source_file_url && (
            <>
              {" "}
              <a href={extraction.source_file_url} target="_blank" rel="noreferrer" className="text-gold-400 hover:text-gold-300">
                View original brochure →
              </a>
            </>
          )}
        </p>
      )}
      {fieldsToCheck.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium text-ink-300">Worth double-checking:</p>
          <ul className="space-y-0.5">
            {fieldsToCheck.map((f) => (
              <li key={f.label} className="text-xs text-ink-400">
                {f.label} <span className="text-ink-500">({f.confidence}% confidence)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
