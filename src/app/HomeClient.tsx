"use client";

import { TrackCard, TrackRow } from "@/components/Player";
import { usePlayer } from "@/context/PlayerContext";
import { Play } from "lucide-react";
import type { UiTrack } from "@/lib/audius";

export function HomeClient({ tracks }: { tracks: UiTrack[] }) {
  const { playTracks } = usePlayer();
  if (tracks.length === 0)
    return <p className="text-sm text-zinc-500">Could not load trending right now. Check your connection and refresh.</p>;

  return (
    <div>
      <button
        onClick={() => playTracks(tracks, 0)}
        className="mb-4 flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-black hover:scale-105"
      >
        <Play size={16} fill="currentColor" /> Play trending
      </button>
      <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
        {tracks.slice(0, 15).map((t) => (
          <TrackCard key={t.id} track={t} queue={tracks} />
        ))}
      </div>
      <div className="grid gap-1 lg:grid-cols-2">
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} queue={tracks} index={i} />
        ))}
      </div>
    </div>
  );
}
