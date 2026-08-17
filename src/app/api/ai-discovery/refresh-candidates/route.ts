import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// AI Project Discovery -- refresh worklist (patch_151). The cloud
// routine has zero database credentials of any kind (by design, same
// as the ingest route it already calls) -- it can't query "which of my
// own past discoveries are due for a re-check." This is the one thing
// it's allowed to read: the stalest already-discovered (ai_source_type
// = 'web_discovery') projects, ordered oldest-checked-first, so the
// routine knows what to research today. Read-only, no side effects --
// a project handed out here isn't marked "checked" until the routine
// actually reports back through POST /api/ai-discovery/ingest, so a
// project the routine runs out of budget to research stays due
// tomorrow rather than being silently skipped for a full cycle.

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 15;

export async function GET(request: NextRequest) {
  const secret = process.env.AI_DISCOVERY_INGEST_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("projects")
    .select(
      "id, name, construction_progress_percent, price_from_aed, handover_quarter, handover_year, payment_plan, ai_last_checked_at, developers(name), communities(name)"
    )
    .eq("ai_source_type", "web_discovery")
    .order("ai_last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to load refresh candidates." }, { status: 500 });
  }

  const projects = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    // The single-record relations come back as an array from this
    // select shape -- take the first entry, same convention used
    // elsewhere in this codebase for a one-to-one join.
    developerName: Array.isArray(p.developers) ? p.developers[0]?.name : (p.developers as { name: string } | null)?.name,
    communityName: Array.isArray(p.communities) ? p.communities[0]?.name : (p.communities as { name: string } | null)?.name,
    currentValues: {
      constructionProgressPercent: p.construction_progress_percent,
      priceFromAed: p.price_from_aed,
      handoverQuarter: p.handover_quarter,
      handoverYear: p.handover_year,
      paymentPlan: p.payment_plan,
    },
    lastCheckedAt: p.ai_last_checked_at,
  }));

  return NextResponse.json({ projects });
}
