import { PublicShell } from "@/components/public/PublicShell";
import { CalculatorsHubClient } from "@/components/public/CalculatorsHubClient";
import { buildOpenGraph } from "@/lib/seo";

export const dynamic = "force-dynamic";

const title = "Property Calculators | Dubai Property Map";
const description =
  "Mortgage, ROI, rental yield, DLD fee, currency, area, payment plan, and affordability calculators for Dubai real estate.";

export const metadata = {
  title,
  description,
  // Previously had neither -- a shared /calculators link fell back to
  // the root layout's generic homepage title/description/canonical
  // instead of this page's own.
  alternates: { canonical: "/calculators" },
  openGraph: buildOpenGraph({ title, description, url: "/calculators" }),
};

export default function CalculatorsPage() {
  return (
    <PublicShell>
      <CalculatorsHubClient />
    </PublicShell>
  );
}
