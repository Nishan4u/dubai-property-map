import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrokerClientDetailClient } from "@/components/broker/BrokerClientDetailClient";
import { getCrmClientDetailForBroker, requireBrokerProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BrokerClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireBrokerProfile();
  const { id } = await params;
  const detail = await getCrmClientDetailForBroker(id, profile.broker_id);
  if (!detail) notFound();

  return (
    <div className="space-y-4 p-6">
      <Link href="/broker/clients" className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-300">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Clients
      </Link>
      <BrokerClientDetailClient detail={detail} />
    </div>
  );
}
