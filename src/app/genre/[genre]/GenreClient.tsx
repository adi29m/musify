"use client";

import { TrackRow } from "@/components/Player";
import { usePlayer } from "@/context/PlayerContext";
import { Play } from "lucide-react";
import type { UiTrack } from "@/lib/audius";

export function GenreClient({ tracks, genre }: { tracks: UiTrack[]; genre: string }) {
  const { playTracks } = usePlayer();
  if (tracks.length === 0)
    return <p className="text-sm text-zinc-500">No trending tracks for {genre} right now. Try another genre.</p>;
  return (
    <div>
      <button onClick={() => playTracks(tracks, 0)} className="mb-4 flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-black hover:scale-105">
        <Play size={16} fill="currentColor" /> Play {genre}
      </button>
      <div className="grid gap-1 lg:grid-cols-2">
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} queue={tracks} index={i} />
        ))}
      </div>
    </div>
  );
}
