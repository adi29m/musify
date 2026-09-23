"use client";

import { PlayerProvider } from "@/context/PlayerContext";
import { LikedProvider } from "@/context/LikedContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <LikedProvider>{children}</LikedProvider>
    </PlayerProvider>
  );
}
