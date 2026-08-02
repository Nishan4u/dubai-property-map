import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SalespersonClientDetailClient } from "@/components/salesperson/SalespersonClientDetailClient";
import { getCrmClientDetailForSalesperson, requireSalespersonProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function SalespersonClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireSalespersonProfile();
  const { id } = await params;
  const detail = await getCrmClientDetailForSalesperson(id, profile.salesperson_id);
  if (!detail) notFound();

  return (
    <div className="space-y-4 p-6">
      <Link href="/salesperson/clients" className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-300">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Clients
      </Link>
      <SalespersonClientDetailClient detail={detail} />
    </div>
  );
}
