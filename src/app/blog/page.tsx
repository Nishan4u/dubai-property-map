import { Newspaper } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function BlogPage() {
  return (
    <PublicShell>
      <PlaceholderPage
        icon={Newspaper}
        title="Market News & Guides"
        description="Investment insights, Golden Visa guides, mortgage tips and Dubai area guides will live here."
        bullets={[
          "Market news & investment analysis",
          "Golden Visa & mortgage guides",
          "Dubai area guides",
        ]}
      />
    </PublicShell>
  );
}
