import { ShieldCheck } from "lucide-react";
import { SecurityPanel } from "@/components/account/SecurityPanel";

export const dynamic = "force-dynamic";

export default function AdminSecurityPage() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
        <ShieldCheck className="h-5 w-5 text-gold-400" /> Security
      </h1>
      <SecurityPanel />
    </div>
  );
}
