import { Mail, MessageCircle, Phone, Users } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { createClient } from "@/lib/supabase/server";
import { requireSalespersonProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

interface BrokerAgg {
  id: string;
  full_name: string;
  brn: string;
  mobile: string;
  whatsapp: string;
  email: string;
  totalRequests: number;
  activeRequests: number;
  bookings: number;
}

export default async function SalespersonBrokersPage() {
  const profile = await requireSalespersonProfile();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("property_requests")
    .select("status, brokers(id, full_name, brn, mobile, whatsapp, email)")
    .eq("salesperson_id", profile.salesperson_id);

  const byBroker = new Map<string, BrokerAgg>();
  for (const r of requests ?? []) {
    const b = r.brokers as unknown as BrokerAgg | null;
    if (!b) continue;
    const entry =
      byBroker.get(b.id) ??
      { id: b.id, full_name: b.full_name, brn: b.brn, mobile: b.mobile, whatsapp: b.whatsapp, email: b.email, totalRequests: 0, activeRequests: 0, bookings: 0 };
    entry.totalRequests += 1;
    if (!["new", "closed_won", "lost", "cancelled"].includes(r.status)) entry.activeRequests += 1;
    if (r.status === "booking" || r.status === "closed_won") entry.bookings += 1;
    byBroker.set(b.id, entry);
  }
  const brokers = Array.from(byBroker.values());

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Users className="h-5 w-5 text-gold-400" /> My Brokers
        </h1>
        <p className="text-sm text-ink-400">Brokers who&apos;ve sent you property requests.</p>
      </div>
      <DataTable
        columns={[
          { header: "Broker", render: (b) => <span className="font-medium text-ink-100">{b.full_name}</span> },
          { header: "BRN", render: (b) => b.brn },
          { header: "Requests", render: (b) => b.totalRequests },
          { header: "Active", render: (b) => b.activeRequests },
          { header: "Bookings", render: (b) => b.bookings },
          {
            header: "Contact",
            render: (b) => (
              <div className="flex items-center gap-2 text-ink-500">
                <a href={`tel:${b.mobile}`} title="Call" className="hover:text-gold-400"><Phone className="h-4 w-4" /></a>
                <a href={`https://wa.me/${b.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="hover:text-gold-400"><MessageCircle className="h-4 w-4" /></a>
                <a href={`mailto:${b.email}`} title="Email" className="hover:text-gold-400"><Mail className="h-4 w-4" /></a>
              </div>
            ),
          },
        ]}
        rows={brokers}
      />
    </div>
  );
}
