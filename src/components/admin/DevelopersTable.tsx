"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SearchableDataTable } from "@/components/admin/SearchableDataTable";
import { DeveloperStatusActions } from "@/components/admin/DeveloperStatusActions";
import { DeleteDeveloperButton } from "@/components/admin/DeleteDeveloperButton";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/auditLog";
import type { DeveloperRow, DeveloperStatus } from "@/types/database";

const statusTone: Record<DeveloperStatus, "green" | "gold" | "red"> = {
  active: "green",
  pending: "gold",
  suspended: "red",
};

export function DevelopersTable({
  developers,
}: {
  developers: (DeveloperRow & { projectCount: number })[];
}) {
  const router = useRouter();

  async function handleDeleteSelected(ids: string[]) {
    const names = ids.map((id) => developers.find((d) => d.id === id)?.name).filter(Boolean);
    if (
      !window.confirm(
        `Delete ${ids.length} developer${ids.length === 1 ? "" : "s"}? This removes each developer, all of their projects, and any ad placements. This cannot be undone.\n\n${names.join(", ")}`
      )
    ) {
      return;
    }
    const supabase = createClient();
    for (const id of ids) {
      const dev = developers.find((d) => d.id === id);
      await logAudit("developer.deleted", "developer", id, { name: dev?.name });
      await supabase.from("developers").delete().eq("id", id);
    }
    router.refresh();
  }

  return (
    <SearchableDataTable
      searchPlaceholder="Search developers by name or email..."
      searchFields={(d) => [d.name, d.email]}
      selectable
      onDeleteSelected={handleDeleteSelected}
      columns={[
        {
          header: "Developer",
          render: (d) => (
            <Link
              href={`/admin/developers/${d.id}`}
              className="flex items-center gap-2 font-medium text-ink-100 hover:text-gold-400"
            >
              {d.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.logo_url}
                  alt={d.name}
                  className="h-6 w-6 shrink-0 rounded-full object-contain"
                />
              ) : (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: d.color }}
                >
                  {d.initial}
                </span>
              )}
              {d.name}
              {d.verified && <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />}
            </Link>
          ),
        },
        {
          header: "Projects",
          render: (d) => d.projectCount,
        },
        { header: "Founded", render: (d) => d.founded ?? "—" },
        {
          header: "Status",
          render: (d) => <Badge tone={statusTone[d.status as DeveloperStatus]}>{d.status}</Badge>,
        },
        {
          header: "",
          render: (d) => (
            <div className="flex items-center gap-3">
              <DeveloperStatusActions developerId={d.id} status={d.status} />
              <Link
                href={`/admin/developers/${d.id}`}
                className="text-xs font-medium text-gold-400 hover:text-gold-300"
              >
                View →
              </Link>
              <DeleteDeveloperButton developerId={d.id} developerName={d.name} />
            </div>
          ),
        },
      ]}
      rows={developers}
    />
  );
}
