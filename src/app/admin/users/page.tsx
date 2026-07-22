import { UserCog } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function AdminUsersPage() {
  return (
    <PlaceholderPage
      icon={UserCog}
      title="Platform Users"
      description="Manage buyer/investor accounts, roles and permissions across the platform."
      bullets={["24,591 registered users", "Roles & permissions", "Account suspension"]}
    />
  );
}
