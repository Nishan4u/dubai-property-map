import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findNearestByCategory, type NearestPoi } from "@/lib/investmentScore";

// Same category set the public project page itself uses (project page,
// src/app/projects/[slug]/page.tsx) -- real, named, computed-from-real-data
// nearest places, never invented figures.
const NEARBY_CATEGORY_KEYS = ["metro", "malls", "schools", "hospitals", "airports", "beaches"];

interface JoinedUnitType {
  unit_name: string;
  unit_type: string;
  starting_price_aed: number | null;
  size_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  availability: string;
}

interface JoinedProject {
  name: string;
  slug: string;
  cover_image_url: string | null;
  gradient: string;
  price_from_aed: number;
  bedrooms_from: number;
  bedrooms_to: number;
  communities: { name: string } | { name: string }[] | null;
  developers: { name: string } | { name: string }[] | null;
  lat: number | null;
  lng: number | null;
  payment_plan_details: { label: string; percent: number }[] | null;
  project_unit_types: JoinedUnitType[] | null;
}

interface Agent {
  name: string;
  photoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
}

// Public, no session -- the client viewing a shared collection has no
// platform account. Mirrors /api/reservations/[token]/route.ts's shape
// (service-role lookup by an unguessable uuid token).
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  // hide_* (patch_134) and mode (patch_141) are both newer additions that
  // may not be migrated on every environment yet. PostgREST hard-errors
  // (42703) on an unknown column rather than omitting it, which would
  // otherwise break this already-shipped public route for every existing
  // share link until the migration runs. Three tiers, each one column
  // generation newer than the last, so an environment that has hide_*
  // but not yet `mode` doesn't lose the already-shipped hide_* toggles
  // just because the newest column isn't there yet -- never let one
  // optional column take down features that already shipped before it.
  let collection: {
    id: string;
    title: string;
    owner_type: string;
    broker_id: string | null;
    salesperson_id: string | null;
    developer_id: string | null;
    brokerage_id: string | null;
    hide_developer_name: boolean;
    hide_price: boolean;
    hide_location: boolean;
    mode: string;
  } | null = null;

  const { data: withMode, error: withModeError } = await admin
    .from("crm_collections")
    .select(
      "id, title, owner_type, broker_id, salesperson_id, developer_id, brokerage_id, hide_developer_name, hide_price, hide_location, mode"
    )
    .eq("share_token", token)
    .maybeSingle();

  if (!withModeError) {
    collection = withMode;
  } else {
    const { data: withHide, error: withHideError } = await admin
      .from("crm_collections")
      .select(
        "id, title, owner_type, broker_id, salesperson_id, developer_id, brokerage_id, hide_developer_name, hide_price, hide_location"
      )
      .eq("share_token", token)
      .maybeSingle();
    if (!withHideError) {
      collection = withHide ? { ...withHide, mode: "default" } : null;
    } else {
      const { data: base } = await admin
        .from("crm_collections")
        .select("id, title, owner_type, broker_id, salesperson_id, developer_id, brokerage_id")
        .eq("share_token", token)
        .maybeSingle();
      collection = base
        ? { ...base, hide_developer_name: false, hide_price: false, hide_location: false, mode: "default" }
        : null;
    }
  }

  if (!collection) {
    return NextResponse.json({ error: "This collection link isn't valid." }, { status: 404 });
  }

  // Presentation view analytics (patch_140) -- best-effort, never blocks or
  // breaks this response. Awaited (not truly fire-and-forget) so the write
  // reliably completes before the function returns; the Supabase client
  // resolves rather than throws on a DB error (e.g. an unmigrated
  // environment where the table doesn't exist yet), so its result is just
  // discarded -- analytics is a nice-to-have, not a page-load dependency.
  await admin.from("crm_collection_views").insert({ collection_id: collection.id });

  // Branded presentations -- the agent's own photo/name/contact shown on
  // the page so the buyer knows exactly who sent it and how to reach
  // them. All the underlying columns already existed on brokers/
  // salespersons/brokerages/developers before this -- no new table needed.
  let agent: Agent | null = null;
  if (collection.owner_type === "broker" && collection.broker_id) {
    const { data: broker } = await admin
      .from("brokers")
      .select("full_name, photo_url, mobile, whatsapp, email")
      .eq("id", collection.broker_id)
      .maybeSingle();
    if (broker) {
      agent = {
        name: broker.full_name,
        photoUrl: broker.photo_url,
        phone: broker.mobile,
        whatsapp: broker.whatsapp,
        email: broker.email,
      };
    }
  } else if (collection.owner_type === "salesperson" && collection.salesperson_id) {
    const { data: sp } = await admin
      .from("salespersons")
      .select("full_name, photo_url, mobile, whatsapp, email")
      .eq("id", collection.salesperson_id)
      .maybeSingle();
    if (sp) {
      agent = { name: sp.full_name, photoUrl: sp.photo_url, phone: sp.mobile, whatsapp: sp.whatsapp, email: sp.email };
    }
  } else if (collection.owner_type === "broker_agency" && collection.brokerage_id) {
    const { data: agency } = await admin
      .from("brokerages")
      .select("name, contact_person, logo_url, phone, company_email")
      .eq("id", collection.brokerage_id)
      .maybeSingle();
    if (agency) {
      agent = {
        name: agency.contact_person || agency.name,
        photoUrl: agency.logo_url,
        phone: agency.phone,
        whatsapp: null,
        email: agency.company_email,
      };
    }
  } else if (collection.owner_type === "developer" && collection.developer_id) {
    const { data: dev } = await admin
      .from("developers")
      .select("name, logo_url, phone, email")
      .eq("id", collection.developer_id)
      .maybeSingle();
    if (dev) {
      agent = { name: dev.name, photoUrl: dev.logo_url, phone: dev.phone, whatsapp: null, email: dev.email };
    }
  }

  // lat/lng, payment_plan_details, and project_unit_types are all
  // long-shipped columns/tables (not new in this batch), so they stay
  // inside this one select -- no extra fallback tier needed the way a
  // genuinely new column (e.g. `mode`, patch_141) would require.
  const { data: items } = await admin
    .from("crm_collection_items")
    .select(
      "sort_order, projects(name, slug, cover_image_url, gradient, price_from_aed, bedrooms_from, bedrooms_to, lat, lng, payment_plan_details, communities(name), developers(name), project_unit_types(unit_name, unit_type, starting_price_aed, size_sqft, bedrooms, bathrooms, availability))"
    )
    .eq("collection_id", collection.id)
    .order("sort_order", { ascending: true });

  const projects = (items ?? [])
    .map((item) => (Array.isArray(item.projects) ? item.projects[0] : item.projects) as JoinedProject | null)
    .filter((p): p is JoinedProject => p !== null)
    .map((p) => {
      const community = Array.isArray(p.communities) ? p.communities[0] : p.communities;
      const developer = Array.isArray(p.developers) ? p.developers[0] : p.developers;
      // Location Intelligence (Presentation Studio 2.0, item 4) -- computed
      // server-side (not in PresentationClient.tsx, a public client
      // component) so the ~103KB POI dataset findNearestByCategory reads
      // never ships to the browser. Forced empty when hide_location is on:
      // real place names/distances would otherwise let a viewer infer the
      // community even with the location hidden, silently defeating that
      // toggle's whole purpose.
      const nearbyPoi: NearestPoi[] =
        !collection.hide_location && p.lat != null && p.lng != null
          ? findNearestByCategory(p.lat, p.lng, NEARBY_CATEGORY_KEYS)
          : [];
      return {
        name: p.name,
        slug: p.slug,
        coverImageUrl: p.cover_image_url,
        gradient: p.gradient,
        // Hidden fields are stripped here, server-side, not just hidden by
        // CSS on the client -- the whole point of these toggles is "the
        // buyer has to contact the agent for this," so the real value
        // must never reach the browser when hidden.
        priceFromAed: collection.hide_price ? null : p.price_from_aed,
        bedroomsFrom: p.bedrooms_from,
        bedroomsTo: p.bedrooms_to,
        communityName: collection.hide_location ? null : (community?.name ?? null),
        developerName: collection.hide_developer_name ? null : (developer?.name ?? null),
        paymentPlanDetails: p.payment_plan_details ?? [],
        nearbyPoi,
        // A second, undocumented path to a real price -- also nulled per
        // unit when hide_price is on, same as priceFromAed above.
        unitTypes: (p.project_unit_types ?? []).map((u) => ({
          unitName: u.unit_name,
          unitType: u.unit_type,
          startingPriceAed: collection.hide_price ? null : u.starting_price_aed,
          sizeSqft: u.size_sqft,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          availability: u.availability,
        })),
      };
    });

  return NextResponse.json({ title: collection.title, mode: collection.mode, agent, projects });
}
