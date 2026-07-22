import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function DeveloperSettingsPage() {
  return (
    <PlaceholderPage
      icon={Settings}
      title="Settings"
      description="Notification preferences, API keys, and integrations for your developer account."
      bullets={["Notification preferences", "API access", "Integrations"]}
    />
  );
}
