import { Wallet } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function AdminPaymentsPage() {
  return (
    <PlaceholderPage
      icon={Wallet}
      title="Payments & Revenue"
      description="Track subscription revenue, featured listing sales, invoices and VAT reporting."
      bullets={["Subscription revenue", "Featured listing invoices", "VAT reports"]}
    />
  );
}
