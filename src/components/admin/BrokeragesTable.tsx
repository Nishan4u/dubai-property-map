"use client";

import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import { BrokerageVerifiedToggle } from "@/components/admin/BrokerageVerifiedToggle";
import { DeleteBrokerageButton } from "@/components/admin/DeleteBrokerageButton";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import type { BrokerageRow } from "@/types/database";

export function BrokeragesTable({
  brokerages,
}: {
  brokerages: (BrokerageRow & { brokerCount: number })[];
}) {
  const router = useRouter();

  async function handleDeleteSelected(ids: string[]) {
    const targets = ids.map((id) => brokerages.find((br) => br.id === id)).filter((br) => br != null);
    // brokers.brokerage_id is ON DELETE RESTRICT -- skip any brokerage that
    // still has brokers assigned instead of letting the DB reject the whole
    // batch, matching DeleteBrokerageButton's single-row guard.
    const blocked = targets.filter((br) => br.brokerCount > 0);
    const deletable = targets.filter((br) => br.brokerCount === 0);

    if (blocked.length > 0) {
      window.alert(
        `${blocked.length} brokerage(s) still have brokers assigned and were skipped: ${blocked.map((br) => br.name).join(", ")}`
      );
    }
    if (deletable.length === 0) return;
    if (
      !window.confirm(
        `Delete ${deletable.length} brokerage${deletable.length === 1 ? "" : "s"}? This removes each brokerage account permanently. This cannot be undone.\n\n${deletable.map((br) => br.name).join(", ")}`
      )
    ) {
      return;
    }
    const supabase = createClient();
    for (const br of deletable) {
      await logAudit("brokerage.deleted", "brokerage", br.id, { name: br.name });
      await supabase.from("brokerages").delete().eq("id", br.id);
    }
    router.refresh();
  }

  return (
    <SearchableDataTable
      searchPlaceholder="Search brokerages by name..."
      searchFields={(br) => [br.name]}
      selectable
      onDeleteSelected={handleDeleteSelected}
      columns={[
        {
          header: "Brokerage",
          render: (br) => (
            <span className="flex items-center gap-2 font-medium text-ink-100">
              {br.name}
              {br.verified && <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />}
            </span>
          ),
        },
        {
          header: "Brokers",
          render: (br) => br.brokerCount,
        },
        {
          header: "Status",
          render: (br) => <Badge tone={br.verified ? "green" : "neutral"}>{br.verified ? "Verified" : "Unverified"}</Badge>,
        },
        {
          header: "",
          render: (br) => <BrokerageVerifiedToggle brokerageId={br.id} verified={br.verified} />,
        },
        {
          header: "",
          render: (br) => (
            <DeleteBrokerageButton
              brokerageId={br.id}
              brokerageName={br.name}
              brokerCount={br.brokerCount}
            />
          ),
        },
      ]}
      rows={brokerages}
    />
  );
}
