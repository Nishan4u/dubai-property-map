import { CreditCard } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function BillingPage() {
  return (
    <PlaceholderPage
      icon={CreditCard}
      title="Billing & Invoices"
      description="View invoices, payment methods, and VAT details for your subscription and featured listings."
      bullets={["Invoice history", "Payment methods", "VAT summaries"]}
    />
  );
}
