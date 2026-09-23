"use client";

import { TrackCard } from "@/components/Player";
import type { UiTrack } from "@/lib/audius";

// Light horizontal card rail for home shelves (no rows — keeps home fast).
export function TrackShelf({ tracks, emptyText }: { tracks: UiTrack[]; emptyText: string }) {
  if (tracks.length === 0) return <p className="text-sm text-zinc-500">{emptyText}</p>;
  const shown = tracks.slice(0, 12);
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {shown.map((t) => (
        <TrackCard key={t.id} track={t} queue={shown} />
      ))}
    </div>
  );
}
