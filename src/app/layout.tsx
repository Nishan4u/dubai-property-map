import type { Metadata } from "next";
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
