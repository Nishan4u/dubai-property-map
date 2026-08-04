import { AdminApiKeysManager } from "@/components/admin/AdminApiKeysManager";
import { getAllApiKeysAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminApiKeysPage() {
  const apiKeys = await getAllApiKeysAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">API Keys</h1>
        <p className="text-sm text-ink-400">
          Issue and revoke keys for the platform&apos;s read-only Public API — for external partners and integrators,
          distinct from the per-account CRM webhook integrations under Integrations.
        </p>
      </div>

      <AdminApiKeysManager apiKeys={apiKeys} />
    </div>
  );
}
