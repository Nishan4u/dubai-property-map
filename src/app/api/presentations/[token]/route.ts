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

// Public, no session -- the client viewing a shared collection has no
// platform account. Mirrors /api/reservations/[token]/route.ts's shape
// (service-role lookup by an unguessable uuid token).
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: collection } = await admin
    .from("crm_collections")
    .select("id, title")
    .eq("share_token", token)
    .maybeSingle();

  if (!collection) {
    return NextResponse.json({ error: "This collection link isn't valid." }, { status: 404 });
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
        priceFromAed: p.price_from_aed,
        bedroomsFrom: p.bedrooms_from,
        bedroomsTo: p.bedrooms_to,
        communityName: community?.name ?? null,
        developerName: developer?.name ?? null,
      };
    });

  return NextResponse.json({ title: collection.title, projects });
}
