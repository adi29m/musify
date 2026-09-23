"use client";

import { PlayerProvider } from "@/context/PlayerContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <PlayerProvider>{children}</PlayerProvider>;
}
