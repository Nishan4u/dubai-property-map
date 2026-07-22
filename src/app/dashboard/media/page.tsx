import { Image as ImageIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function MediaPage() {
  return (
    <PlaceholderPage
      icon={ImageIcon}
      title="Media Library"
      description="Manage images, videos, drone footage, and 360° virtual tours across all your projects."
      bullets={["Images & videos", "Drone footage", "360° virtual tours"]}
    />
  );
}
