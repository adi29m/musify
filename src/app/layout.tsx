import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { PlayerBar } from "@/components/Player";
import { NowPlayingPanel } from "@/components/NowPlayingPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Musify — Spotify Clone",
  description: "End-to-end Spotify clone with free legal streaming across every genre, artist and band in the open Audius catalog.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col bg-black text-white">
        <Providers>
          <div className="flex min-h-0 flex-1">
            <Suspense fallback={<div className="hidden w-[320px] shrink-0 p-2 md:block"><div className="h-full rounded-lg bg-[#121212]" /></div>}>
              <Sidebar />
            </Suspense>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col p-2 sm:p-3 sm:pl-0">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#0a0a0a]">
                <TopBar />
                <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 pt-2 sm:px-6 sm:pb-32">
                  {children}
                </main>
              </div>
            </div>
            <NowPlayingPanel />
          </div>
          <PlayerBar />
        </Providers>
      </body>
    </html>
  );
}
