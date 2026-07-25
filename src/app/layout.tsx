import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FavoritesProvider } from "@/components/auth/FavoritesProvider";
import { CommunityFavoritesProvider } from "@/components/auth/CommunityFavoritesProvider";
import { AnalyticsScripts } from "@/components/public/AnalyticsScripts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dubai Property Map | Find Off-Plan & Ready Properties",
  description:
    "Explore Dubai's premium property market on an interactive map — off-plan launches, ready homes, developers, and communities.",
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
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-navy-950 text-ink-100">
        <AnalyticsScripts />
        <FavoritesProvider>
          <CommunityFavoritesProvider>{children}</CommunityFavoritesProvider>
        </FavoritesProvider>
      </body>
    </html>
  );
}
