import { Bell } from "lucide-react";
import { adminActivity } from "@/data/mock";

export default function DeveloperNotificationsPage() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
        <Bell className="h-5 w-5 text-gold-400" /> Notifications
      </h1>
      <ul className="divide-y divide-navy-800 rounded-xl border border-navy-700 bg-navy-850">
        {adminActivity.map((a) => (
          <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-ink-200">{a.text}</span>
            <span className="text-xs text-ink-500">{a.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
