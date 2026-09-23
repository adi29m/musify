import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { PlayerBar } from "@/components/Player";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col bg-black text-white">
        <Providers>
          <div className="flex min-h-0 flex-1">
            <Sidebar />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 pl-0">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#0a0a0a]">
                <TopBar />
                <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-2 sm:px-6">
                  {children}
                </main>
              </div>
            </div>
          </div>
          <PlayerBar />
        </Providers>
      </body>
    </html>
  );
}
