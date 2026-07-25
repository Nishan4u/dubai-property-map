import { NotificationBroadcast } from "@/components/admin/NotificationBroadcast";
import { getAllDevelopersAdmin } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const developers = await getAllDevelopersAdmin();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Notifications</h1>
        <p className="text-sm text-ink-400">
          Send a real in-app notification to buyers or developers — it appears
          instantly in their Notifications tab/page. Email, SMS, WhatsApp and
          push delivery would require you to connect real SMTP/Twilio/Firebase
          accounts (see Settings) — not wired up here.
        </p>
      </div>

      <NotificationBroadcast
        developers={developers.map((d) => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}
