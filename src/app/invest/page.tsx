import { PublicShell } from "@/components/public/PublicShell";
import { InvestmentQuizWizard } from "@/components/public/InvestmentQuizWizard";
import { getCommunities, getSupportWhatsappNumber } from "@/lib/supabase/queries";
import { buildOpenGraph } from "@/lib/seo";

export const dynamic = "force-dynamic";

const title = "Dubai Investment Report | Dubai Property Map";
const description =
  "Tell us what you're looking for and get a free, real-data investment report for Dubai real estate — prices, ROI, rental yield, and location intelligence.";

export const metadata = {
  title,
  description,
  alternates: { canonical: "/invest" },
  openGraph: buildOpenGraph({ title, description, url: "/invest" }),
};

export default async function InvestPage() {
  const [communities, supportWhatsappNumber] = await Promise.all([getCommunities(), getSupportWhatsappNumber()]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink-100">Get Your Free Dubai Investment Report</h1>
          <p className="mt-2 text-sm text-ink-400">
            Answer a few quick questions and get real prices, ROI, rental yield, and location data — in under a
            minute.
          </p>
        </div>
        <InvestmentQuizWizard
          communities={communities.map((c) => ({ id: c.id, name: c.name }))}
          supportWhatsappNumber={supportWhatsappNumber}
        />
      </div>
    </PublicShell>
  );
}
