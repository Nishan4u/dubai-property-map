import Link from "next/link";
import type { MapAccessStatus } from "@/lib/supabase/queries";

export function MapAccessOverlay({
  status,
  subscriptionHref,
  contentLabel = "the interactive Dubai Property Map",
}: {
  status: Exclude<MapAccessStatus, "ok">;
  subscriptionHref: string;
  contentLabel?: string;
}) {
  const content =
    status === "guest"
      ? {
          title: "Unlock Dubai Property Map",
          body: `Register or log in to access ${contentLabel}.`,
          cta: [
            { label: "Login", href: "/login" },
            { label: "Register", href: "/register" },
          ],
        }
      : status === "no_subscription"
        ? {
            title: "Subscription Required",
            body: `You need an active subscription to access ${contentLabel}.`,
            cta: [{ label: "View Subscription Plans", href: subscriptionHref }],
          }
        : {
            title: "Subscription Expired",
            body: `Renew your subscription to continue accessing ${contentLabel}.`,
            cta: [{ label: "Renew Subscription", href: subscriptionHref }],
          };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-navy-950/60" />
      <div className="relative w-full max-w-sm rounded-2xl border border-navy-700 bg-navy-900/95 p-8 text-center shadow-2xl">
        <h2 className="text-lg font-bold text-ink-100">{content.title}</h2>
        <p className="mt-2 text-sm text-ink-400">{content.body}</p>
        <div className="mt-5 flex gap-2">
          {content.cta.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex-1 rounded-lg bg-gold-500 py-2.5 text-center text-sm font-semibold text-navy-950 hover:bg-gold-400"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
