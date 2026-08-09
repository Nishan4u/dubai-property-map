import Script from "next/script";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// platform_settings' only RLS policy is "admin manages" (using is_admin()),
// which is correct for the genuinely sensitive rows in that table (API
// secrets, SMTP config) but was also silently blocking every real, logged-
// out visitor from ever receiving these 5 rows -- meaning GA/GTM/Meta/
// TikTok/AdSense have never actually reached a real visitor, only an admin
// who happened to be browsing signed in. A service-role read is the right
// fix here rather than a new public RLS policy on the whole table: these
// five values are IDs meant to be embedded in every page's public
// HTML anyway (that's how a <script src="...client=ca-pub-...."> works),
// so there's nothing a service-role read exposes that isn't already
// visible in any page's view-source.
export async function AnalyticsScripts() {
  // Set by proxy.ts on /admin, /dashboard, /broker, /broker-agency,
  // /salesperson, /staff, and /embed -- no ads on internal admin/portal
  // pages, or inside the Developer Embeddable Map Widget's third-party
  // iframe. GA/GTM/Meta/TikTok are unaffected -- only the ad script below
  // checks this.
  const noAds = (await headers()).get("x-no-ads") === "1";

  let settings: Record<string, string> = {};
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", [
        "google_analytics_id",
        "gtm_container_id",
        "meta_pixel_id",
        "tiktok_pixel_id",
        "google_adsense_publisher_id",
        "adsense_enabled",
      ]);
    settings = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
  } catch {
    // Missing SUPABASE_SERVICE_ROLE_KEY, transient DB error, etc. -- this
    // component is mounted in the root layout for every page on the site,
    // so it must never throw and take the whole app down over an optional
    // tracking script.
  }
  const gaId = settings.google_analytics_id;
  const gtmId = settings.gtm_container_id;
  const metaPixelId = settings.meta_pixel_id;
  const tiktokPixelId = settings.tiktok_pixel_id;
  // patch_23 seeded this row (label "Google AdSense Publisher ID") already
  // populated with the real "pub-XXXXXXXXXXXXXXXX" id -- same format/value
  // as public/ads.txt -- but it was never read by any script until now.
  // AdSense's own JS snippet needs a "ca-" prefix on top of that id; adding
  // it here (rather than storing "ca-pub-..." in the setting itself) keeps
  // the stored value consistent with ads.txt and tolerates an admin pasting
  // either "pub-..." or "ca-pub-..." into the settings field.
  // Admin's own on/off switch for AdSense (/admin/settings, patch_132) --
  // separate from the publisher id so switching off never loses it.
  const adsenseEnabled = settings.adsense_enabled !== "false";
  const rawAdsensePublisherId = noAds || !adsenseEnabled ? null : settings.google_adsense_publisher_id;
  const adsenseClientId = rawAdsensePublisherId
    ? rawAdsensePublisherId.startsWith("ca-")
      ? rawAdsensePublisherId
      : `ca-${rawAdsensePublisherId}`
    : null;

  return (
    <>
      {adsenseClientId && (
        // Was beforeInteractive, then afterInteractive -- see git history
        // for the first change's reasoning (still valid: Next's own docs
        // reserve beforeInteractive for "critical scripts" like bot
        // detectors, not ad networks). afterInteractive alone measurably
        // fixed desktop (Performance 48->80, TBT 2.7s->60ms) via a live
        // PageSpeed audit, but the SAME audit's mobile run got WORSE
        // (TBT 1.17s->3.95s) -- the working theory is that afterInteractive
        // now fires AdSense at roughly the same moment DubaiMap's own
        // async chunk (mapbox-gl + POI/metro/highway layer setup, a
        // genuinely heavy synchronous mount) starts its own work, and
        // mobile's CPU throttling punishes that overlap far harder than
        // desktop does. lazyOnload defers AdSense to browser idle time --
        // after the map's startup work is done -- so the two heavy tasks
        // no longer compete for the same slice of main-thread time. Stated
        // honestly: a single before/after PageSpeed run has real variance
        // on mobile TBT specifically, so this is a well-reasoned next step
        // based on the evidence so far, not a confirmed root-cause fix --
        // re-measure after this ships.
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      )}

      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');`}
          </Script>
        </>
      )}

      {gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {metaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');`}
        </Script>
      )}

      {tiktokPixelId && (
        <Script id="tiktok-pixel-init" strategy="afterInteractive">
          {`!function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktokPixelId}');
              ttq.page();
              }(window, document, 'ttq');`}
        </Script>
      )}
    </>
  );
}
