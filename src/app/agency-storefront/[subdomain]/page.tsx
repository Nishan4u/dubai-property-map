import { createAdminClient } from "@/lib/supabase/admin";
import { AgencyStorefrontClient } from "@/components/public/AgencyStorefrontClient";
import { buildOpenGraph } from "@/lib/seo";

// Mirrors src/app/present/[token]/page.tsx's exact shape -- a thin
// server wrapper, all real data fetching happens client-side against
// /api/agency-storefront/[subdomain] (service-role, keyed by the
// subdomain -- never direct table RLS for this anonymous public read).
export const dynamic = "force-dynamic";

// Unlike /present/[token] (a private, unindexed share link -- see
// robots.ts), a storefront's whole point is being found by search for
// the agency's own name, so it gets real per-agency metadata. A small,
// separate lookup from the same admin client the API route uses -- not
// worth threading data through a shared fetch for one title/description.
export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const admin = createAdminClient();
  const { data: agency } = await admin.from("brokerages").select("name").eq("subdomain", subdomain).maybeSingle();
  if (!agency) return {};

  const title = `${agency.name} — Featured Properties in Dubai`;
  const description = `Browse ${agency.name}'s featured Dubai off-plan and ready properties, with direct contact details.`;
  const url = `https://${subdomain}.dubaipropertymap.ae`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: buildOpenGraph({ title, description, url }),
  };
}

export default async function AgencyStorefrontPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  return <AgencyStorefrontClient subdomain={subdomain} />;
}
