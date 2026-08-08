import Link from "next/link";
import type { MapAccessStatus } from "@/lib/supabase/queries";

// Inline (non-overlay) sibling of MapAccessOverlay, for use BELOW real
// public summary content rather than on top of a blurred skeleton. Used
// where a guest/unsubscribed viewer already sees genuine name/price/
// description content (SEO-safe summary) and this card explains what
// registering or subscribing unlocks beyond that summary.
export function PublicDetailGateCard({
  status,
  subscriptionHref,
  contentLabel,
  subscribeCtaLabel = "View Subscription Plans",
}: {
  status: Exclude<MapAccessStatus, "ok">;
  subscriptionHref: string;
  contentLabel: string;
  subscribeCtaLabel?: string;
}) {
  const content =
    status === "guest"
      ? {
          title: "Register or Log In to See More",
          body: `Register or log in to unlock ${contentLabel}.`,
          cta: [
            { label: "Login", href: "/login" },
            { label: "Register", href: "/register" },
          ],
        }
      : status === "no_subscription"
        ? {
            title: "Subscribe to See More",
            body: `You need an active subscription to unlock ${contentLabel}.`,
            cta: [{ label: subscribeCtaLabel, href: subscriptionHref }],
          }
        : {
            title: "Subscription Expired",
            body: `Renew your subscription to unlock ${contentLabel}.`,
            cta: [{ label: "Renew Subscription", href: subscriptionHref }],
          };

  return (
    <div className="mt-8 rounded-2xl border border-gold-500/30 bg-navy-900 p-6 text-center shadow-xl sm:p-8">
      <h2 className="text-lg font-bold text-ink-100">{content.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-400">{content.body}</p>
      <div className="mx-auto mt-5 flex max-w-xs gap-2">
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
  );
}
