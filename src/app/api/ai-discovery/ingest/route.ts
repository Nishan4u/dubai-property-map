import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/ai/rateLimit";
import { pickGradient, slugify, matchCommunity } from "@/lib/ai/projectDraftUtils";
import { getCommunities } from "@/lib/supabase/queries";
import { notifyAdmins } from "@/lib/notify";
import { logAudit } from "@/lib/auditLog";
import type { ExtractedField } from "@/lib/ai/projectExtraction";

// AI Project Discovery ingest (patch_150). Called once daily by an
// external Anthropic-cloud scheduled agent (not app infra -- this VPS
// has no reachable cron) that does its own web research for genuinely
// new Dubai project announcements and POSTs structured candidates
// here. This route is deliberately the ONLY place that decides
// developer/project identity, community matching, dedup, and the
// auto-publish-vs-draft branch -- the calling agent never gets
// database credentials of any kind, so nothing it submits can bypass
// this route's own validation.

type CandidateField<T> = { value: T | null; confidence: number };

interface DiscoveryCandidate {
  developer: { name: string; website?: string | null };
  fields: {
    name: CandidateField<string>;
    description?: CandidateField<string>;
    communityNameGuess?: CandidateField<string>;
    propertyType?: CandidateField<string>;
    listingType?: CandidateField<"off-plan" | "ready">;
    priceFromAed?: CandidateField<number>;
    paymentPlan?: CandidateField<string>;
    bedroomsFrom?: CandidateField<number>;
    bedroomsTo?: CandidateField<number>;
    handoverQuarter?: CandidateField<string>;
    handoverYear?: CandidateField<number>;
    launchDate?: CandidateField<string>;
    // Optional, 0-100. Set on creation when known; on a refresh check
    // (see REFRESH_FIELDS below) this is the headline field the whole
    // 24h re-check cycle exists for -- construction status/completion
    // changing over time is the literal example this feature is named
    // "change detection" after.
    constructionProgressPercent?: CandidateField<number>;
    amenities?: CandidateField<string[]>;
    tags?: CandidateField<string[]>;
  };
  sourceUrls: string[];
  // Optional. The calling agent is instructed to only ever set this when
  // the source explicitly grants reuse (a developer press kit/media page
  // stating images are available for press/media use) -- never a plain
  // marketing photo with no stated license. This route can't verify that
  // judgment call itself, so it does the one thing it CAN verify: confirm
  // the URL is real and actually serves an image before trusting it.
  imageUrl?: string | null;
}

function clampConfidence(n: unknown): number {
  const num = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, num));
}

function validSourceUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter((u): u is string => {
    if (typeof u !== "string") return false;
    try {
      new URL(u);
      return true;
    } catch {
      return false;
    }
  });
}

// The calling agent decides WHETHER an image is reusable (a judgment call
// this route can't make); this only verifies the URL is real and actually
// serves an image, so a broken/mistyped link never lands as a project's
// cover photo. Never blocks the candidate on failure -- an image is a
// nice-to-have, not a requirement like sourceUrls.
async function verifyImageUrl(url: unknown): Promise<string | null> {
  if (typeof url !== "string") return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    // Some real-world hosts (e.g. Wikimedia) 400 a bare fetch with no
    // descriptive User-Agent -- identify honestly rather than pretend to
    // be a browser.
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "DubaiPropertyMapBot/1.0 (+https://dubaipropertymap.ae; AI Project Discovery image check)" },
    });
    clearTimeout(timeout);
    const contentType = res.headers.get("content-type") ?? "";
    if (res.ok && contentType.startsWith("image/")) return url;
    return null;
  } catch {
    return null;
  }
}

// Fields the ingest route will diff against an already-discovered
// project's current values on a refresh check (see the existingProject
// branch below). Deliberately a short, high-value list -- status/price/
// date facts that genuinely change over a project's lifecycle -- not
// every candidate field. Identity fields (name, developer, community,
// property type) are never refreshed automatically; a real identity
// correction should go through normal admin editing, not an unattended
// re-check.
const REFRESH_FIELDS = [
  { key: "constructionProgressPercent", column: "construction_progress_percent", kind: "number" },
  { key: "priceFromAed", column: "price_from_aed", kind: "number" },
  { key: "handoverQuarter", column: "handover_quarter", kind: "string" },
  { key: "handoverYear", column: "handover_year", kind: "number" },
  { key: "paymentPlan", column: "payment_plan", kind: "string" },
] as const;

export async function POST(request: NextRequest) {
  const secret = process.env.AI_DISCOVERY_INGEST_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited("ai-discovery-ingest")) {
    return NextResponse.json({ error: "Rate limited -- try again later." }, { status: 429 });
  }

  const admin = createAdminClient();

  const { data: settingsRows } = await admin
    .from("platform_settings")
    .select("key, value")
    .in("key", ["ai_discovery_enabled", "ai_discovery_confidence_threshold", "ai_discovery_max_batch_size"]);
  const settings = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));
  const discoveryEnabled = settings.ai_discovery_enabled === "true";
  const threshold = Number(settings.ai_discovery_confidence_threshold) || 85;
  const maxBatchSize = Number(settings.ai_discovery_max_batch_size) || 15;

  let body: { candidates?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.candidates)) {
    return NextResponse.json({ error: "`candidates` must be an array." }, { status: 400 });
  }
  if (body.candidates.length > maxBatchSize) {
    return NextResponse.json(
      { error: `Batch too large -- max ${maxBatchSize} candidates per run.` },
      { status: 400 }
    );
  }

  const communities = await getCommunities();

  const results: Array<{
    name: string;
    developerName: string;
    outcome: "published" | "drafted" | "skipped" | "error" | "updated" | "flagged" | "no_change";
    reason?: string;
    projectId?: string;
    projectSlug?: string;
  }> = [];

  for (const raw of body.candidates as DiscoveryCandidate[]) {
    try {
      const developerName = raw?.developer?.name?.trim();
      const name = raw?.fields?.name?.value?.trim();
      const sourceUrls = validSourceUrls(raw?.sourceUrls);

      if (!developerName || !name) {
        results.push({
          name: name || "(unnamed)",
          developerName: developerName || "(unknown)",
          outcome: "skipped",
          reason: "missing developer or project name",
        });
        continue;
      }
      if (sourceUrls.length === 0) {
        results.push({ name, developerName, outcome: "skipped", reason: "no valid source URL" });
        continue;
      }

      // Developer resolution -- EXACT case-insensitive match only.
      // .ilike() with no wildcards inserted is a plain case-insensitive
      // equality check, not a pattern match -- do not widen this into a
      // `%name%` search; this codebase has its own documented false-
      // positive history from exactly that kind of loose matching
      // (patch_90's "Dubai" vs "Dubai Land Residence Complex" comment).
      const { data: existingDeveloper } = await admin
        .from("developers")
        .select("id")
        .ilike("name", developerName)
        .maybeSingle();

      let developerId = existingDeveloper?.id as string | undefined;
      if (!developerId) {
        const baseSlug = slugify(developerName);
        let devSlug = baseSlug;
        let devInsert = await admin
          .from("developers")
          .insert({
            slug: devSlug,
            name: developerName,
            initial: developerName.charAt(0).toUpperCase() || "D",
            founded: null,
            website: raw.developer.website ?? null,
            logo_url: null,
            status: "pending",
            verified: false,
          })
          .select("id")
          .single();
        if (devInsert.error?.code === "23505") {
          devSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
          devInsert = await admin
            .from("developers")
            .insert({
              slug: devSlug,
              name: developerName,
              initial: developerName.charAt(0).toUpperCase() || "D",
              founded: null,
              website: raw.developer.website ?? null,
              logo_url: null,
              status: "pending",
              verified: false,
            })
            .select("id")
            .single();
        }
        if (devInsert.error || !devInsert.data) {
          results.push({ name, developerName, outcome: "error", reason: "failed to create developer record" });
          continue;
        }
        developerId = devInsert.data.id;
      }

      const fields = raw.fields;

      // Existing-project lookup -- EXACT match only, scoped to this
      // developer. Checked BEFORE community matching (a refresh
      // candidate may not even include a community guess) so a check-in
      // on an already-discovered project never gets skipped for lacking
      // a field only fresh creation needs.
      const { data: existingProject } = await admin
        .from("projects")
        .select(
          "id, ai_source_type, construction_progress_percent, price_from_aed, handover_quarter, handover_year, payment_plan"
        )
        .eq("developer_id", developerId)
        .ilike("name", name)
        .maybeSingle();

      if (existingProject) {
        // Refresh path (change detection, follow-on to patch_150's
        // discovery-only pipeline). Only ever re-checks this platform's
        // own AI Discovery projects -- a manual or brochure-uploaded
        // project that happens to share an exact name is left
        // completely untouched; this pipeline never modifies developer-
        // or admin-entered data.
        if (existingProject.ai_source_type !== "web_discovery") {
          results.push({ name, developerName, outcome: "skipped", reason: "duplicate matches a non-AI-Discovery project" });
          continue;
        }

        const changes: Array<{
          field_name: string;
          old_value: string | null;
          new_value: string;
          confidence: number;
          applied: boolean;
        }> = [];
        const updatePayload: Record<string, unknown> = {};

        for (const { key, column, kind } of REFRESH_FIELDS) {
          const candidateField = fields[key as keyof typeof fields] as CandidateField<unknown> | undefined;
          if (!candidateField || candidateField.value === null || candidateField.value === undefined) continue;
          if (kind === "string" && String(candidateField.value).trim() === "") continue;

          const newValue = candidateField.value;
          const oldValue = (existingProject as unknown as Record<string, unknown>)[column];
          const changed =
            kind === "number"
              ? Number(newValue) !== Number(oldValue)
              : String(newValue).trim() !== String(oldValue ?? "").trim();
          if (!changed) continue;

          const confidence = clampConfidence(candidateField.confidence);
          const applied = discoveryEnabled && confidence >= threshold;
          changes.push({
            field_name: key,
            old_value: oldValue === null || oldValue === undefined ? null : String(oldValue),
            new_value: String(newValue),
            confidence,
            applied,
          });
          if (applied) updatePayload[column] = newValue;
        }

        // Always stamp ai_last_checked_at, even when nothing changed --
        // this IS the 24h re-check happening, whether or not it found
        // anything worth reporting.
        await admin
          .from("projects")
          .update({ ...updatePayload, ai_last_checked_at: new Date().toISOString() })
          .eq("id", existingProject.id);

        if (changes.length === 0) {
          results.push({ name, developerName, outcome: "no_change", projectId: existingProject.id });
          continue;
        }

        await admin
          .from("project_ai_field_changes")
          .insert(changes.map((c) => ({ project_id: existingProject.id, source_urls: sourceUrls, ...c })));

        const appliedCount = changes.filter((c) => c.applied).length;
        await admin.from("project_ai_extractions").insert({
          project_id: existingProject.id,
          developer_id: developerId,
          source_file_name: "AI web research (refresh check)",
          source_file_url: null,
          source_type: "web_discovery",
          is_refresh: true,
          source_urls: sourceUrls,
          extracted_fields: fields as unknown as Record<string, ExtractedField<unknown>>,
          overall_confidence: Math.round(changes.reduce((a, c) => a + c.confidence, 0) / changes.length),
          model: "external-cloud-agent",
          auto_published: appliedCount > 0,
        });

        await logAudit(
          "project.ai_discovery_refresh_checked",
          "project",
          existingProject.id,
          { name, developerName, fieldsChanged: changes.length, fieldsApplied: appliedCount, sourceUrls },
          { client: admin }
        );

        results.push({
          name,
          developerName,
          outcome: appliedCount > 0 ? "updated" : "flagged",
          projectId: existingProject.id,
        });
        continue;
      }

      const matchedCommunity = matchCommunity(fields.communityNameGuess?.value, communities);
      if (!matchedCommunity) {
        // projects.community_id is NOT NULL -- never insert a guess,
        // skip rather than break the constraint or fabricate a match.
        results.push({ name, developerName, outcome: "skipped", reason: "no confident community match" });
        continue;
      }

      const confidences = Object.values(fields)
        .map((f) => (f && typeof f === "object" && "confidence" in f ? clampConfidence((f as CandidateField<unknown>).confidence) : null))
        .filter((c): c is number => typeof c === "number");
      const overallConfidence =
        confidences.length > 0 ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;

      const willAutoPublish = discoveryEnabled && overallConfidence >= threshold;
      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;
      const coverImageUrl = await verifyImageUrl(raw.imageUrl);

      const { data: draft, error: insertError } = await admin
        .from("projects")
        .insert({
          name,
          slug,
          developer_id: developerId,
          community_id: matchedCommunity.id,
          property_type: fields.propertyType?.value ?? "",
          listing_type: fields.listingType?.value ?? "off-plan",
          status: willAutoPublish ? "published" : "draft",
          approval_status: willAutoPublish ? "approved" : "pending",
          data_source: "ai_extracted",
          ai_source_type: "web_discovery",
          price_from_aed: fields.priceFromAed?.value ?? 0,
          payment_plan: fields.paymentPlan?.value ?? "",
          bedrooms_from: fields.bedroomsFrom?.value ?? 0,
          bedrooms_to: fields.bedroomsTo?.value ?? 0,
          handover_quarter: fields.handoverQuarter?.value ?? "",
          handover_year: fields.handoverYear?.value ?? null,
          launch_date: fields.launchDate?.value ?? null,
          construction_progress_percent: fields.constructionProgressPercent?.value ?? 0,
          description: fields.description?.value ?? "",
          amenities: fields.amenities?.value ?? [],
          tags: fields.tags?.value ?? [],
          unit_types: [],
          rating: 0,
          reviews: 0,
          views: 0,
          gradient: pickGradient(),
          cover_image_url: coverImageUrl,
          ai_last_checked_at: new Date().toISOString(),
        })
        .select("id, slug")
        .single();

      if (insertError || !draft) {
        results.push({ name, developerName, outcome: "error", reason: insertError?.message ?? "insert failed" });
        continue;
      }

      await admin.from("project_ai_extractions").insert({
        project_id: draft.id,
        developer_id: developerId,
        source_file_name: "AI web research",
        source_file_url: null,
        source_type: "web_discovery",
        source_urls: sourceUrls,
        extracted_fields: fields as unknown as Record<string, ExtractedField<unknown>>,
        overall_confidence: overallConfidence,
        model: "external-cloud-agent",
        auto_published: willAutoPublish,
      });

      await logAudit(
        willAutoPublish ? "project.ai_discovery_auto_published" : "project.ai_discovery_drafted",
        "project",
        draft.id,
        { name, developerName, confidence: overallConfidence, sourceUrls },
        { client: admin }
      );

      results.push({
        name,
        developerName,
        outcome: willAutoPublish ? "published" : "drafted",
        projectId: draft.id,
        projectSlug: draft.slug,
      });
    } catch (err) {
      results.push({
        name: raw?.fields?.name?.value ?? "(unknown)",
        developerName: raw?.developer?.name ?? "(unknown)",
        outcome: "error",
        reason: err instanceof Error ? err.message : "unexpected error",
      });
    }
  }

  const published = results.filter((r) => r.outcome === "published").length;
  const drafted = results.filter((r) => r.outcome === "drafted").length;
  const skipped = results.filter((r) => r.outcome === "skipped").length;
  const errors = results.filter((r) => r.outcome === "error").length;
  const updated = results.filter((r) => r.outcome === "updated").length;
  const flagged = results.filter((r) => r.outcome === "flagged").length;
  const noChange = results.filter((r) => r.outcome === "no_change").length;

  await logAudit(
    "project_ai_discovery.batch_completed",
    "ai_discovery_batch",
    null,
    { processed: results.length, published, drafted, skipped, errors, updated, flagged, noChange, results },
    { client: admin }
  );

  if (published > 0 || drafted > 0 || updated > 0 || flagged > 0) {
    const parts = [
      published > 0 && `${published} auto-published`,
      drafted > 0 && `${drafted} queued for review`,
      updated > 0 && `${updated} existing listing${updated === 1 ? "" : "s"} auto-updated`,
      flagged > 0 && `${flagged} change${flagged === 1 ? "" : "s"} flagged for review (confidence too low to auto-apply)`,
    ].filter(Boolean);
    await notifyAdmins(`AI Project Discovery run: ${parts.join(", ")}. Review from Admin > Projects.`, admin);
  }

  return NextResponse.json({ processed: results.length, published, drafted, skipped, errors, updated, flagged, noChange, results });
}
