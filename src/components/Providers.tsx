"use client";

import { PlayerProvider } from "@/context/PlayerContext";
import { LikedProvider } from "@/context/LikedContext";
import { UIProvider } from "@/context/UIContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <PlayerProvider>
        <LikedProvider>{children}</LikedProvider>
      </PlayerProvider>
    </UIProvider>
  );
}
