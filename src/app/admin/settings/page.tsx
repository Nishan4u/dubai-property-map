import { Badge } from "@/components/ui/Badge";

const integrations = [
  { name: "Google Maps API", configured: true },
  { name: "Mapbox API", configured: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN },
  { name: "SMTP", configured: false },
  { name: "WhatsApp API", configured: false },
  { name: "Firebase", configured: false },
  { name: "Payment Gateway", configured: false },
  { name: "Cloud Storage", configured: false },
  { name: "CDN", configured: true },
  { name: "Social Login", configured: false },
  { name: "Google Analytics", configured: false },
  { name: "Google Tag Manager", configured: false },
  { name: "Meta Pixel", configured: false },
  { name: "TikTok Pixel", configured: false },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">Settings</h1>
        <p className="text-sm text-ink-400">
          Platform integrations and API keys.
        </p>
      </div>

      <div className="divide-y divide-navy-800 rounded-xl border border-navy-700 bg-navy-850">
        {integrations.map((i) => (
          <div key={i.name} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-ink-200">{i.name}</span>
            <div className="flex items-center gap-3">
              <Badge tone={i.configured ? "green" : "neutral"}>
                {i.configured ? "Configured" : "Not configured"}
              </Badge>
              <button className="text-xs font-medium text-gold-400 hover:text-gold-300">
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
