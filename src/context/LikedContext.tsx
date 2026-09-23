"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UiTrack } from "@/lib/audius";

type LikedCtx = {
  likedIds: Set<string>;
  loaded: boolean;
  isLiked: (id: string) => boolean;
  toggleLike: (track: UiTrack) => Promise<void>;
};

const Ctx = createContext<LikedCtx | null>(null);

// Single fetch for the whole app — replaces the old per-row /api/likes?trackId=
// request that fired N times (and re-rendered N rows) on every list mount.
export function LikedProvider({ children }: { children: React.ReactNode }) {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/likes?ids=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((j) => {
        if (!cancelled) {
          setLikedIds(new Set((j.ids ?? []) as string[]));
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);

  const toggleLike = useCallback(
    async (track: UiTrack) => {
      const wasLiked = likedIds.has(track.id);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(track.id);
        else next.add(track.id);
        return next;
      });
      try {
        if (wasLiked) {
          const r = await fetch(`/api/likes?trackId=${track.id}`, { method: "DELETE" });
          if (r.status === 401) window.location.href = "/login";
          if (!r.ok) throw new Error("unlike failed");
        } else {
          const r = await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trackId: track.id, title: track.title, artist: track.artist,
              artwork: track.artwork, genre: track.genre, duration: track.duration,
            }),
          });
          if (r.status === 401) {
            window.location.href = "/login";
            return;
          }
          if (!r.ok) throw new Error("like failed");
        }
      } catch {
        // revert optimistic update
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(track.id);
          else next.delete(track.id);
          return next;
        });
      }
    },
    [likedIds]
  );

  const value = useMemo(() => ({ likedIds, loaded, isLiked, toggleLike }), [likedIds, loaded, isLiked, toggleLike]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLiked(): LikedCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLiked must be used within LikedProvider");
  return c;
}
