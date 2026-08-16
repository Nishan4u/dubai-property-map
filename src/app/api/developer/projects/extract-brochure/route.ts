import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/ai/rateLimit";
import { extractProjectFromDocument, type ExtractedField } from "@/lib/ai/projectExtraction";
import { getCommunities, getPropertyTypes, getAmenitiesList } from "@/lib/supabase/queries";
import { notifyAdmins } from "@/lib/notify";
import { categorySlug } from "@/lib/documentCategories";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

const gradients = [
  "from-amber-500/40 via-slate-800 to-slate-950",
  "from-sky-500/40 via-slate-800 to-slate-950",
  "from-emerald-500/40 via-slate-800 to-slate-950",
  "from-fuchsia-500/40 via-slate-800 to-slate-950",
  "from-rose-500/40 via-slate-800 to-slate-950",
  "from-indigo-500/40 via-slate-800 to-slate-950",
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// "Upload Brochure -> AI Draft Project" (patch_149). Mirrors the same
// service-role, route-does-its-own-validation shape already established
// by /api/investment-leads and /api/broker/property-requests/[id]/client
// -- the draft project + extraction record are written via
// createAdminClient() rather than the RLS-scoped client, since a new
// project row (and the storage path it unlocks) has to exist before any
// of that can happen at all.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role, developer_id").eq("id", user.id).single();
  if (profile?.role !== "developer" || !profile.developer_id) {
    return NextResponse.json({ error: "Developer account required." }, { status: 403 });
  }
  const developerId = profile.developer_id;

  if (isRateLimited(`extract-brochure:${developerId}`)) {
    return NextResponse.json({ error: "Too many uploads -- please wait a bit and try again." }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported right now." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is too large -- please upload a PDF under 20MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64Pdf = bytes.toString("base64");

  const [communities, propertyTypeRows, amenityRows] = await Promise.all([
    getCommunities(),
    getPropertyTypes(),
    getAmenitiesList(),
  ]);
  const propertyTypes = propertyTypeRows.map((p) => p.name as string);
  const amenityOptions = amenityRows.map((a) => a.name as string);

  let extraction;
  try {
    extraction = await extractProjectFromDocument({
      base64Pdf,
      fileName: file.name,
      propertyTypes,
      amenityOptions,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI extraction failed -- please try again." },
      { status: 502 }
    );
  }

  const { fields } = extraction;

  // The one field held to a stricter standard than "best guess, flag low
  // confidence": a wrong community match creates a real, misleading
  // relationship, so it's resolved against the platform's actual
  // community list (exact, then case-insensitive substring) rather than
  // trusting the model's own id-guessing -- no confident match means
  // null, not a guess.
  const communityGuess = (fields.communityNameGuess?.value ?? "").trim().toLowerCase();
  const matchedCommunity = communityGuess
    ? communities.find((c) => c.name.toLowerCase() === communityGuess) ??
      communities.find((c) => c.name.toLowerCase().includes(communityGuess) || communityGuess.includes(c.name.toLowerCase()))
    : null;

  const name = fields.name?.value?.trim() || "Untitled Project (AI Draft)";
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;

  const admin = createAdminClient();

  const { data: draft, error: insertError } = await admin
    .from("projects")
    .insert({
      name,
      slug,
      developer_id: developerId,
      community_id: matchedCommunity?.id ?? null,
      property_type: fields.propertyType?.value ?? "",
      listing_type: fields.listingType?.value ?? "off-plan",
      status: "draft",
      data_source: "ai_extracted",
      price_from_aed: fields.priceFromAed?.value ?? 0,
      payment_plan: fields.paymentPlan?.value ?? "",
      bedrooms_from: fields.bedroomsFrom?.value ?? 0,
      bedrooms_to: fields.bedroomsTo?.value ?? 0,
      handover_quarter: fields.handoverQuarter?.value ?? "",
      handover_year: fields.handoverYear?.value ?? null,
      launch_date: fields.launchDate?.value ?? null,
      description: fields.description?.value ?? "",
      video_url: fields.videoUrl?.value ?? null,
      virtual_tour_url: fields.virtualTourUrl?.value ?? null,
      amenities: fields.amenities?.value ?? [],
      tags: fields.tags?.value ?? [],
      dld_permit_number: fields.dldPermitNumber?.value ?? null,
      trakheesi_number: fields.trakheesiNumber?.value ?? null,
      madmoun_qr_url: fields.madmounQrUrl?.value ?? null,
      unit_types: [],
      rating: 0,
      reviews: 0,
      views: 0,
      gradient: gradients[Math.floor(Math.random() * gradients.length)],
    })
    .select("id")
    .single();

  if (insertError || !draft) {
    return NextResponse.json({ error: insertError?.message ?? "Failed to create draft project." }, { status: 500 });
  }

  // Store the original brochure alongside the draft -- same bucket/path
  // convention ProjectFileManager.tsx already uses (folder "documents",
  // category "Brochure"), just via the admin client since the RLS
  // ownership check only allows the authenticated developer's own
  // browser session, not this server-side upload.
  const storagePath = `${draft.id}/documents/${categorySlug("Brochure")}/${Date.now()}-${slugify(file.name)}.pdf`;
  const { error: uploadError } = await admin.storage.from("project-media").upload(storagePath, bytes, {
    contentType: "application/pdf",
  });
  const sourceFileUrl = uploadError
    ? null
    : admin.storage.from("project-media").getPublicUrl(storagePath).data.publicUrl;

  await admin.from("project_ai_extractions").insert({
    project_id: draft.id,
    developer_id: developerId,
    source_file_name: file.name,
    source_file_url: sourceFileUrl,
    extracted_fields: fields as unknown as Record<string, ExtractedField<unknown>>,
    overall_confidence: extraction.overallConfidence,
    model: extraction.model,
  });

  await notifyAdmins(
    `New AI-extracted project draft: "${name}" -- ${extraction.overallConfidence}% confidence, needs review.`,
    admin
  );

  return NextResponse.json({ projectId: draft.id });
}
