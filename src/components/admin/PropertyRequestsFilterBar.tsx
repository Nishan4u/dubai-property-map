"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CompactSelect } from "@/components/public/CompactSelect";

export function PropertyRequestsFilterBar({
  developers,
  statuses,
}: {
  developers: { id: string; name: string }[];
  statuses: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-700 bg-navy-850 p-4">
      <CompactSelect
        label="Developer"
        placeholder="All Developers"
        value={searchParams.get("developer") ?? ""}
        onChange={(v) => setParam("developer", v)}
        options={developers.map((d) => ({ label: d.name, value: d.id }))}
        className="w-64"
      />
      <CompactSelect
        label="Status"
        placeholder="All Statuses"
        value={searchParams.get("status") ?? ""}
        onChange={(v) => setParam("status", v)}
        options={statuses.map((s) => ({ label: s.replace(/_/g, " "), value: s }))}
        searchable={false}
        className="w-56"
      />
    </div>
  );
}
