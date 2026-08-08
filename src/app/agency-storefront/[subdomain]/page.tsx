import { AgencyStorefrontClient } from "@/components/public/AgencyStorefrontClient";

// Mirrors src/app/present/[token]/page.tsx's exact shape -- a thin
// server wrapper, all real data fetching happens client-side against
// /api/agency-storefront/[subdomain] (service-role, keyed by the
// subdomain -- never direct table RLS for this anonymous public read).
export const dynamic = "force-dynamic";

export default async function AgencyStorefrontPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  return <AgencyStorefrontClient subdomain={subdomain} />;
}
