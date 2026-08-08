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
  status: string;
  communities: { name: string } | { name: string }[] | null;
  developers: { name: string } | { name: string }[] | null;
}

// Public, no session -- an agency's storefront visitor has no platform
// account. Mirrors /api/presentations/[token]/route.ts's exact shape:
// service-role lookup keyed by an identifier in the URL, never direct
// table RLS for the anonymous read.
export async function GET(request: NextRequest, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const admin = createAdminClient();

  const { data: agency } = await admin
    .from("brokerages")
    .select("id, name, logo_url, phone, company_email, contact_person")
    .eq("subdomain", subdomain)
    .maybeSingle();

  if (!agency) {
    return NextResponse.json({ error: "This agency page isn't available." }, { status: 404 });
  }

  const { data: items } = await admin
    .from("brokerage_storefront_items")
    .select(
      "sort_order, projects(name, slug, cover_image_url, gradient, price_from_aed, bedrooms_from, bedrooms_to, status, communities(name), developers(name))"
    )
    .eq("brokerage_id", agency.id)
    .order("sort_order", { ascending: true });

  // Same published/featured filter as getPublishedProjects() -- a
  // project that's since gone back to draft/archived must never keep
  // showing on an agency's public storefront just because it's still in
  // their picked list.
  const projects = (items ?? [])
    .map((item) => (Array.isArray(item.projects) ? item.projects[0] : item.projects) as JoinedProject | null)
    .filter((p): p is JoinedProject => p !== null && (p.status === "published" || p.status === "featured"))
    .map((p) => {
      const community = Array.isArray(p.communities) ? p.communities[0] : p.communities;
      const developer = Array.isArray(p.developers) ? p.developers[0] : p.developers;
      return {
        name: p.name,
        slug: p.slug,
        coverImageUrl: p.cover_image_url,
        gradient: p.gradient,
        priceFromAed: p.price_from_aed,
        bedroomsFrom: p.bedrooms_from,
        bedroomsTo: p.bedrooms_to,
        communityName: community?.name ?? null,
        developerName: developer?.name ?? null,
      };
    });

  return NextResponse.json({
    agency: {
      name: agency.name,
      logoUrl: agency.logo_url,
      contactName: agency.contact_person || agency.name,
      phone: agency.phone,
      email: agency.company_email,
    },
    projects,
  });
}
