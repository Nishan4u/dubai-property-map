import { Megaphone } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function AdvertisePage() {
  return (
    <PublicShell>
      <PlaceholderPage
        icon={Megaphone}
        title="Advertise on Dubai Property Map"
        description="Homepage banners, sponsored map pins and native ad placements for developers and agencies."
        bullets={[
          "Homepage & community banners",
          "Sponsored map pins",
          "Newsletter placements",
        ]}
      />
    </PublicShell>
  );
}
