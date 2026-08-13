import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findNearestByCategory, type NearestPoi } from "@/lib/investmentScore";

// Same category set the public project page itself uses (project page,
// src/app/projects/[slug]/page.tsx) -- real, named, computed-from-real-data
// nearest places, never invented figures.
const NEARBY_CATEGORY_KEYS = ["metro", "malls", "schools", "hospitals", "airports", "beaches"];

interface JoinedUnitType {
  id: string;
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

// A broker's own listing attached to a Collection (patch_145) --
// mutually exclusive with JoinedProject on the same crm_collection_items
// row (exactly one of project_id/broker_listing_id is ever set).
interface JoinedBrokerListing {
  id: string;
  slug: string;
  title: string;
  property_type: string;
  listing_type: string;
  price_aed: number;
  location_text: string | null;
  lat: number | null;
  lng: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  communities: { name: string } | { name: string }[] | null;
  brokers: { full_name: string; photo_url: string | null } | { full_name: string; photo_url: string | null }[] | null;
}

// Normalized shape both a project and a broker's own listing map into --
// `kind` tells PresentationClient.tsx which detail page to link to and
// which fields are meaningful (a broker listing has no developer/unit-
// types/payment-plan; a project has no single bathrooms/sizeSqft/
// propertyType/brokerName).
interface PresentationItem {
  kind: "project" | "brokerListing";
  name: string;
  slug: string;
  coverImageUrl: string | null;
  gradient: string;
  priceFromAed: number | null;
  bedroomsFrom: number;
  bedroomsTo: number;
  bathrooms: number | null;
  sizeSqft: number | null;
  propertyType: string | null;
  listingType: string | null;
  communityName: string | null;
  developerName: string | null;
  brokerName: string | null;
  brokerPhotoUrl: string | null;
  paymentPlanDetails: { label: string; percent: number }[];
  nearbyPoi: NearestPoi[];
  unitTypes: {
    unitName: string;
    unitType: string;
    startingPriceAed: number | null;
    sizeSqft: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    availability: string;
  }[];
}

// A broker listing has no marketing gradient column (that's projects-
// only) -- one fixed, considered default so every broker-listing card
// looks intentional rather than blank, matching BrokerListingCard.tsx's
// existing "no photo -> gradient block" convention rather than inventing
// per-listing color logic.
const BROKER_LISTING_GRADIENT = "from-indigo-500/40 via-slate-800 to-slate-950";

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
  // inside the base select. selected_unit_type_ids (patch_144) and
  // broker_listings (patch_145) are each genuinely new, so each gets its
  // own fallback tier layered on top of the last -- same "each new
  // column generation gets its own extra tier" convention as the
  // collection's own mode/hide_* tiers above. Falls back all the way to
  // this route's original project-only behavior on a fully unmigrated
  // environment.
  const PROJECTS_JOIN =
    "projects(name, slug, cover_image_url, gradient, price_from_aed, bedrooms_from, bedrooms_to, lat, lng, payment_plan_details, communities(name), developers(name), project_unit_types(id, unit_name, unit_type, starting_price_aed, size_sqft, bedrooms, bathrooms, availability))";
  const BROKER_LISTINGS_JOIN =
    "broker_listings(id, slug, title, property_type, listing_type, price_aed, location_text, lat, lng, bedrooms, bathrooms, size_sqft, communities(name), brokers(full_name, photo_url))";

  type Item = {
    sort_order: number;
    selected_unit_type_ids: string[] | null;
    projects: JoinedProject | JoinedProject[] | null;
    broker_listings: JoinedBrokerListing | JoinedBrokerListing[] | null;
  };
  let items: Item[] = [];

  const { data: withListings, error: withListingsError } = await admin
    .from("crm_collection_items")
    .select(`sort_order, selected_unit_type_ids, ${PROJECTS_JOIN}, ${BROKER_LISTINGS_JOIN}`)
    .eq("collection_id", collection.id)
    .order("sort_order", { ascending: true });

  if (!withListingsError) {
    items = withListings ?? [];
  } else {
    const { data: withUnitFilter, error: withUnitFilterError } = await admin
      .from("crm_collection_items")
      .select(`sort_order, selected_unit_type_ids, ${PROJECTS_JOIN}`)
      .eq("collection_id", collection.id)
      .order("sort_order", { ascending: true });
    if (!withUnitFilterError) {
      items = (withUnitFilter ?? []).map((i) => ({ ...i, broker_listings: null }));
    } else {
      const { data: base } = await admin
        .from("crm_collection_items")
        .select(`sort_order, ${PROJECTS_JOIN}`)
        .eq("collection_id", collection.id)
        .order("sort_order", { ascending: true });
      items = (base ?? []).map((b) => ({ ...b, selected_unit_type_ids: null, broker_listings: null }));
    }
  }

  const presentationItems: PresentationItem[] = items
    .map((item): PresentationItem | null => {
      const project = (Array.isArray(item.projects) ? item.projects[0] : item.projects) as JoinedProject | null;
      const listing = (Array.isArray(item.broker_listings) ? item.broker_listings[0] : item.broker_listings) as
        | JoinedBrokerListing
        | null;

      if (project) {
        const community = Array.isArray(project.communities) ? project.communities[0] : project.communities;
        const developer = Array.isArray(project.developers) ? project.developers[0] : project.developers;
        // Location Intelligence (Presentation Studio 2.0, item 4) --
        // computed server-side (not in PresentationClient.tsx, a public
        // client component) so the ~103KB POI dataset
        // findNearestByCategory reads never ship to the browser. Forced
        // empty when hide_location is on: real place names/distances
        // would otherwise let a viewer infer the community even with
        // the location hidden, silently defeating that toggle's whole
        // purpose.
        const nearbyPoi: NearestPoi[] =
          !collection.hide_location && project.lat != null && project.lng != null
            ? findNearestByCategory(project.lat, project.lng, NEARBY_CATEGORY_KEYS)
            : [];
        // Guided Wizard's unit-type picker (patch_144) -- a non-empty
        // selectedUnitTypeIds narrows the presentation to just those
        // unit types; null/empty (every existing collection, and every
        // one made via the plain "New Collection" form, which never
        // sets this) shows all of them, identical to this route's
        // original behavior.
        const allUnitTypes = project.project_unit_types ?? [];
        const shownUnitTypes =
          item.selected_unit_type_ids && item.selected_unit_type_ids.length > 0
            ? allUnitTypes.filter((u) => item.selected_unit_type_ids!.includes(u.id))
            : allUnitTypes;
        return {
          kind: "project",
          name: project.name,
          slug: project.slug,
          coverImageUrl: project.cover_image_url,
          gradient: project.gradient,
          // Hidden fields are stripped here, server-side, not just
          // hidden by CSS on the client -- the whole point of these
          // toggles is "the buyer has to contact the agent for this,"
          // so the real value must never reach the browser when hidden.
          priceFromAed: collection.hide_price ? null : project.price_from_aed,
          bedroomsFrom: project.bedrooms_from,
          bedroomsTo: project.bedrooms_to,
          bathrooms: null,
          sizeSqft: null,
          propertyType: null,
          listingType: null,
          communityName: collection.hide_location ? null : (community?.name ?? null),
          developerName: collection.hide_developer_name ? null : (developer?.name ?? null),
          brokerName: null,
          brokerPhotoUrl: null,
          paymentPlanDetails: project.payment_plan_details ?? [],
          nearbyPoi,
          // A second, undocumented path to a real price -- also nulled
          // per unit when hide_price is on, same as priceFromAed above.
          unitTypes: shownUnitTypes.map((u) => ({
            unitName: u.unit_name,
            unitType: u.unit_type,
            startingPriceAed: collection.hide_price ? null : u.starting_price_aed,
            sizeSqft: u.size_sqft,
            bedrooms: u.bedrooms,
            bathrooms: u.bathrooms,
            availability: u.availability,
          })),
        };
      }

      if (listing) {
        const community = Array.isArray(listing.communities) ? listing.communities[0] : listing.communities;
        const broker = Array.isArray(listing.brokers) ? listing.brokers[0] : listing.brokers;
        // Same hide_location contract as a project's Location
        // Intelligence above -- a broker's own listing gets the exact
        // same stripping, no separate rule.
        const nearbyPoi: NearestPoi[] =
          !collection.hide_location && listing.lat != null && listing.lng != null
            ? findNearestByCategory(listing.lat, listing.lng, NEARBY_CATEGORY_KEYS)
            : [];
        return {
          kind: "brokerListing",
          name: listing.title,
          slug: listing.slug,
          coverImageUrl: null,
          gradient: BROKER_LISTING_GRADIENT,
          priceFromAed: collection.hide_price ? null : listing.price_aed,
          bedroomsFrom: listing.bedrooms ?? 0,
          bedroomsTo: listing.bedrooms ?? 0,
          bathrooms: listing.bathrooms,
          sizeSqft: listing.size_sqft,
          propertyType: listing.property_type,
          listingType: listing.listing_type,
          communityName: collection.hide_location ? null : (community?.name ?? listing.location_text ?? null),
          // No developer on a broker's own listing -- hide_developer_name
          // doesn't apply here, there's nothing to strip.
          developerName: null,
          brokerName: broker?.full_name ?? null,
          brokerPhotoUrl: broker?.photo_url ?? null,
          paymentPlanDetails: [],
          nearbyPoi,
          unitTypes: [],
        };
      }

      return null;
    })
    .filter((x): x is PresentationItem => x !== null);

  return NextResponse.json({ title: collection.title, mode: collection.mode, agent, projects: presentationItems });
}
