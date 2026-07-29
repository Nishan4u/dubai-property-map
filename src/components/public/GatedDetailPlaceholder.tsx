import { MapAccessOverlay } from "@/components/public/MapAccessOverlay";
import type { MapAccessStatus } from "@/lib/supabase/queries";

// Full-page equivalent of ProjectAccessGate for individual project/developer
// detail pages (spec section 20: "Direct Project URL" and section 21:
// "Direct URL" must both be protected, not just listing/discovery
// surfaces). Unlike ProjectAccessGate, this never receives the real
// entity's data as children -- it renders a generic, non-identifying
// skeleton, so an unauthorized viewer's page payload genuinely never
// contains the protected name/price/description/etc. ("view source" or
// disabling CSS reveals nothing real, same guarantee as the map).
export function GatedDetailPlaceholder({
  status,
  subscriptionHref,
  contentLabel,
}: {
  status: Exclude<MapAccessStatus, "ok">;
  subscriptionHref: string;
  contentLabel: string;
}) {
  return (
    <div className="relative mx-auto max-h-screen max-w-6xl overflow-hidden px-6 py-10">
      <div className="pointer-events-none max-h-[75vh] select-none overflow-hidden blur-sm" aria-hidden="true">
        <div className="h-8 w-2/3 rounded-lg bg-navy-800" />
        <div className="mt-3 h-4 w-1/3 rounded bg-navy-800" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-64 rounded-2xl bg-navy-850" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-navy-850" />
              ))}
            </div>
            <div className="h-32 rounded-2xl bg-navy-850" />
            <div className="h-48 rounded-2xl bg-navy-850" />
          </div>
          <div className="space-y-4">
            <div className="h-40 rounded-2xl bg-navy-850" />
            <div className="h-56 rounded-2xl bg-navy-850" />
          </div>
        </div>
      </div>
      <MapAccessOverlay
        status={status}
        subscriptionHref={subscriptionHref}
        contentLabel={contentLabel}
        titleOverride={{
          guest: "Register or Subscribe to Continue",
          no_subscription: "Register or Subscribe to Continue",
          subscription_expired: "Register or Subscribe to Continue",
        }}
      />
    </div>
  );
}
