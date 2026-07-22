import {
  MousePointerClick,
  Download,
  Phone,
  MessageCircle,
  CalendarCheck,
  MapPin,
  Percent,
  Eye,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { TrendAreaChart } from "@/components/ui/Charts";
import { developerAnalytics } from "@/data/mock";

const metrics = [
  { label: "Visitors", value: "18,642", icon: Eye },
  { label: "Clicks", value: "9,204", icon: MousePointerClick },
  { label: "Downloads", value: "1,038", icon: Download },
  { label: "Phone Calls", value: "612", icon: Phone },
  { label: "WhatsApp", value: "1,489", icon: MessageCircle },
  { label: "Bookings", value: "312", icon: CalendarCheck },
  { label: "Map Clicks", value: "5,120", icon: MapPin },
  { label: "CTR", value: "6.8%", icon: Percent },
];

export default function DeveloperAnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Analytics</h1>
        <p className="text-sm text-ink-400">
          Engagement across all your published projects.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} icon={m.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Views Over Time">
          <TrendAreaChart data={developerAnalytics} dataKey="views" color="#a855f7" />
        </SectionCard>
        <SectionCard title="Leads Over Time">
          <TrendAreaChart data={developerAnalytics} dataKey="leads" color="#38bdf8" />
        </SectionCard>
      </div>
    </div>
  );
}
