import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // The hide_* columns are a newer addition (patch_134) that may not be
  // migrated on every environment yet. PostgREST hard-errors (42703) on an
  // unknown column rather than omitting it, which would otherwise break
  // this already-shipped public route for every existing share link until
  // the migration runs. Try the full select first; if it fails for any
  // reason, fall back to the base select and treat the new flags as their
  // eventual default (false) -- never let an optional column take down an
  // existing feature.
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
  } | null = null;

  const { data: full, error: fullError } = await admin
    .from("crm_collections")
    .select(
      "id, title, owner_type, broker_id, salesperson_id, developer_id, brokerage_id, hide_developer_name, hide_price, hide_location"
    )
    .eq("share_token", token)
    .maybeSingle();

  if (!fullError) {
    collection = full;
  } else {
    const { data: base } = await admin
      .from("crm_collections")
      .select("id, title, owner_type, broker_id, salesperson_id, developer_id, brokerage_id")
      .eq("share_token", token)
      .maybeSingle();
    collection = base ? { ...base, hide_developer_name: false, hide_price: false, hide_location: false } : null;
  }

  if (!collection) {
    return NextResponse.json({ error: "This collection link isn't valid." }, { status: 404 });
  }

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

  const { data: items } = await admin
    .from("crm_collection_items")
    .select(
      "sort_order, projects(name, slug, cover_image_url, gradient, price_from_aed, bedrooms_from, bedrooms_to, communities(name), developers(name))"
    )
    .eq("collection_id", collection.id)
    .order("sort_order", { ascending: true });

  const projects = (items ?? [])
    .map((item) => (Array.isArray(item.projects) ? item.projects[0] : item.projects) as JoinedProject | null)
    .filter((p): p is JoinedProject => p !== null)
    .map((p) => {
      const community = Array.isArray(p.communities) ? p.communities[0] : p.communities;
      const developer = Array.isArray(p.developers) ? p.developers[0] : p.developers;
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
      };
    });

  return NextResponse.json({ title: collection.title, agent, projects });
}
