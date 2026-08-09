import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FavoritesProvider } from "@/components/auth/FavoritesProvider";
import { CommunityFavoritesProvider } from "@/components/auth/CommunityFavoritesProvider";
import { AnalyticsScripts } from "@/components/public/AnalyticsScripts";
import { InstallAppPrompt } from "@/components/public/InstallAppPrompt";
import { PushNotificationPrompt } from "@/components/public/PushNotificationPrompt";
import { ServiceWorkerRegister } from "@/components/public/ServiceWorkerRegister";
import { AiChatWidget } from "@/components/public/AiChatWidget";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getCurrency, getLocale } from "@/lib/i18n/locale";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://dubaipropertymap.ae";
const SITE_TITLE = "Dubai Property Map | Find Off-Plan & Ready Properties";
const SITE_DESCRIPTION =
  "Explore Dubai's premium property market on an interactive map — off-plan launches, ready homes, developers, and communities.";

export const metadata: Metadata = {
  // Resolves relative OG/canonical URLs against the real domain (was
  // unset, so any page not supplying an absolute URL of its own would
  // fall back to Next.js's default localhost base -- a real gap for
  // link-unfurling/crawlers, not just a build-time warning).
  metadataBase: new URL(SITE_URL),
  // Plain string, not a { default, template } object -- every page in
  // this codebase that sets its own title already writes the full
  // "X | Dubai Property Map" suffix itself (confirmed via a repo-wide
  // grep), so a template here was silently double-appending the suffix
  // on every single page with metadata, site-wide, pre-dating this fix
  // (confirmed live on /projects and /about, neither touched this
  // session, both showing "X | Dubai Property Map | Dubai Property Map").
  // Only used verbatim, with no template, for pages with no title at all.
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Dubai Property Map",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  // Google Search Console domain-ownership verification -- lets it be
  // added/rotated without editing HTML directly.
  verification: {
    google: "vfL-M34WA33FzMbGooIlYSJzrWE_8-CH2CK3SQXkeW4",
  },
  // Site-wide OG/Twitter defaults -- individual pages (projects, developers,
  // communities, blog) already override title/description/images via their
  // own generateMetadata; this is only the fallback for pages that don't
  // (homepage, about, faq, etc.) and for og:site_name / og:locale, which no
  // page-level metadata was setting.
  openGraph: {
    siteName: "Dubai Property Map",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    locale: "en_AE",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05080f",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const currency = await getCurrency();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-navy-950 text-ink-100">
        <AnalyticsScripts />
        <LocaleProvider initialLocale={locale} initialCurrency={currency}>
          <FavoritesProvider>
            <CommunityFavoritesProvider>{children}</CommunityFavoritesProvider>
          </FavoritesProvider>
          <InstallAppPrompt />
          <PushNotificationPrompt />
          <ServiceWorkerRegister />
          <AiChatWidget />
        </LocaleProvider>
      </body>
    </html>
  );
}
