import { Megaphone } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function AdminAdsPage() {
  return (
    <PlaceholderPage
      icon={Megaphone}
      title="Advertisements"
      description="Manage homepage banners, sponsored pins, native ads and Google Ad Manager placements."
      bullets={[
        "Homepage & community banners",
        "Sponsored map pins",
        "Google AdSense / Ad Manager",
        "Popup & newsletter ads",
      ]}
    />
  );
}
