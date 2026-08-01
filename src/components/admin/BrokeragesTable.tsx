"use client";

import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import { BrokerageVerifiedToggle } from "@/components/admin/BrokerageVerifiedToggle";
import { DeleteBrokerageButton } from "@/components/admin/DeleteBrokerageButton";
import type { BrokerageRow } from "@/types/database";

export function BrokeragesTable({
  brokerages,
}: {
  brokerages: (BrokerageRow & { brokerCount: number })[];
}) {
  return (
    <SearchableDataTable
      searchPlaceholder="Search brokerages by name..."
      searchFields={(br) => [br.name]}
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
