"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { developers } from "@/data/mock";

export default function AdminDevelopersPage() {
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Developers</h1>
        <p className="text-sm text-ink-400">
          {developers.length} developers registered on the platform.
        </p>
      </div>

      <DataTable
        columns={[
          {
            header: "Developer",
            render: (d) => (
              <Link
                href={`/admin/developers/${d.id}`}
                className="flex items-center gap-2 font-medium text-ink-100 hover:text-gold-400"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: d.color }}
                >
                  {d.initial}
                </span>
                {d.name}
                {d.verified && <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />}
              </Link>
            ),
          },
          { header: "Projects", render: (d) => d.projectsCount },
          { header: "Rating", render: (d) => `${d.rating}★ (${d.reviews})` },
          { header: "Founded", render: (d) => d.founded },
          {
            header: "Status",
            render: () => <Badge tone="green">Active</Badge>,
          },
          {
            header: "",
            render: (d) => (
              <div className="flex gap-2">
                <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300">
                  Approve
                </button>
                <button className="text-xs font-medium text-rose-400 hover:text-rose-300">
                  Suspend
                </button>
                <Link
                  href={`/admin/developers/${d.id}`}
                  className="text-xs font-medium text-gold-400 hover:text-gold-300"
                >
                  View →
                </Link>
              </div>
            ),
          },
        ]}
        rows={developers}
      />
    </div>
  );
}
