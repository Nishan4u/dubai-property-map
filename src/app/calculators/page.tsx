import { PublicShell } from "@/components/public/PublicShell";
import { CalculatorsHubClient } from "@/components/public/CalculatorsHubClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Property Calculators | Dubai Property Map",
  description:
    "Mortgage, ROI, rental yield, DLD fee, currency, area, payment plan, and affordability calculators for Dubai real estate.",
};

export default function CalculatorsPage() {
  return (
    <PublicShell>
      <CalculatorsHubClient />
    </PublicShell>
  );
}
