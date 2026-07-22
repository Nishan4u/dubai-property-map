import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function DocumentsPage() {
  return (
    <PlaceholderPage
      icon={FileText}
      title="Documents"
      description="Store brochures, factsheets, payment plan PDFs, price lists, NOCs and legal documents."
      bullets={["Brochures & factsheets", "Payment plans & price lists", "NOC & legal documents"]}
    />
  );
}
