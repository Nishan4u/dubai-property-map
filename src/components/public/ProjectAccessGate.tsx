import { clsx } from "clsx";
import { MapAccessOverlay } from "@/components/public/MapAccessOverlay";
import type { MapAccessStatus } from "@/lib/supabase/queries";

// Reusable version of the blur-and-overlay treatment already used on the
// homepage map (spec section 20: "Protect Projects Everywhere ... gate ALL
// of it, not just Map"). Callers must already have withheld the real
// project data server-side when status !== "ok" -- this only supplies the
// consistent visual treatment, it isn't itself the protection.
export function ProjectAccessGate({
  status,
  subscriptionHref,
  contentLabel,
  titleOverride,
  bodyOverride,
  subscribeCtaLabel,
  children,
}: {
  status: MapAccessStatus;
  subscriptionHref: string;
  contentLabel?: string;
  titleOverride?: Partial<Record<Exclude<MapAccessStatus, "ok">, string>>;
  bodyOverride?: Partial<Record<Exclude<MapAccessStatus, "ok">, string>>;
  subscribeCtaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        className={clsx(
          status !== "ok" && "pointer-events-none max-h-[70vh] select-none overflow-hidden blur-sm"
        )}
      >
        {children}
      </div>
      {status !== "ok" && (
        <MapAccessOverlay
          status={status}
          subscriptionHref={subscriptionHref}
          contentLabel={contentLabel}
          titleOverride={titleOverride}
          bodyOverride={bodyOverride}
          subscribeCtaLabel={subscribeCtaLabel}
        />
      )}
    </div>
  );
}
