"use client";

import { useRouter } from "next/navigation";
import { Heart, Play, Pause } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import type { UiTrack } from "@/lib/audius";

type Tile =
  | { kind: "liked" }
  | { kind: "playlist"; id: string; name: string }
  | { kind: "track"; track: UiTrack; queue: UiTrack[] };

function EqBars() {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="eq-bar w-[3px] rounded-sm bg-green-500" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

export function QuickGrid({ audius, popular }: { audius: UiTrack[]; popular: UiTrack[] }) {
  const { playTracks, playTrack, current, isPlaying, toggle } = usePlayer();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/playlists", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { playlists: [] }))
      .then((j) => setPlaylists((j.playlists ?? []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const tiles: Tile[] = useMemo(() => {
    const out: Tile[] = [{ kind: "liked" }];
    for (const p of playlists) {
      if (out.length >= 8) break;
      out.push({ kind: "playlist", id: p.id, name: p.name });
    }
    const pool = [...popular, ...audius];
    for (const t of pool) {
      if (out.length >= 8) break;
      out.push({ kind: "track", track: t, queue: pool });
    }
    return out;
  }, [playlists, audius, popular]);

  if (tiles.length <= 1) return null;

  return (
    <div className="mb-8 grid grid-cols-2 gap-2 lg:grid-cols-4 [&>*:nth-child(n+7)]:hidden lg:[&>*:nth-child(n+7)]:flex">
      {tiles.map((tile, i) => {
        if (tile.kind === "liked") {
          return (
            <button
              key="liked"
              onClick={() => router.push("/library?tab=liked")}
              className="group flex h-16 items-center gap-3 overflow-hidden rounded-md bg-white/10 text-left transition hover:bg-white/20 sm:h-20"
            >
              <span className="grid h-full aspect-square shrink-0 place-items-center bg-gradient-to-br from-indigo-500 to-violet-300">
                <Heart size={22} className="text-white" fill="currentColor" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">Liked Songs</span>
            </button>
          );
        }
        if (tile.kind === "playlist") {
          return (
            <button
              key={`pl-${tile.id}`}
              onClick={() => router.push(`/library?playlist=${tile.id}`)}
              className="group flex h-16 items-center gap-3 overflow-hidden rounded-md bg-white/10 text-left transition hover:bg-white/20 sm:h-20"
            >
              <span className="grid h-full aspect-square shrink-0 place-items-center bg-zinc-800 text-lg font-black text-zinc-400">
                ♪
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{tile.name}</span>
            </button>
          );
        }
        const t = tile.track;
        const active = current?.id === t.id;
        return (
          <div
            key={t.id + i}
            onClick={() => (active ? toggle() : playTrack(t, tile.queue))}
            className="group flex h-16 cursor-pointer items-center gap-3 overflow-hidden rounded-md bg-white/10 transition hover:bg-white/20 sm:h-20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.artwork} alt="" loading="lazy" className="h-full aspect-square shrink-0 object-cover" />
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{t.title}</span>
            <span className="shrink-0 pr-3">
              {active && isPlaying ? (
                <EqBars />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-green-500 text-black opacity-0 shadow-xl transition group-hover:opacity-100 max-lg:opacity-100">
                  {active ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
