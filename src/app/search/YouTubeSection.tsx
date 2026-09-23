"use client";

import { TrackRow } from "@/components/Player";
import { usePlayer } from "@/context/PlayerContext";
import { Play } from "lucide-react";
import type { UiTrack } from "@/lib/audius";

export function YouTubeSection({ tracks, query, configured }: { tracks: UiTrack[]; query: string; configured: boolean }) {
  const { playTracks } = usePlayer();

  if (!configured) {
    return (
      <section className="mb-8 rounded-lg border border-zinc-800 bg-[#121212] p-4">
        <h2 className="mb-1 text-xl font-bold text-white">Popular songs — full tracks</h2>
        <p className="text-sm text-zinc-400">
          YouTube search isn&apos;t configured on this server yet (needs a free Data API v3 key).
          Audius results below still play in full.
        </p>
      </section>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-xl font-bold text-white">Popular songs — full tracks on YouTube</h2>
      <p className="mb-3 text-xs text-zinc-500">Full-length playback for {query ? `“${query}”` : "your search"} via the official YouTube player.</p>
      <button
        onClick={() => playTracks(tracks, 0)}
        className="mb-4 flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white hover:scale-105"
      >
        <Play size={16} fill="currentColor" /> Play all
      </button>
      <div className="grid gap-1 lg:grid-cols-2">
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} queue={tracks} index={i} />
        ))}
      </div>
    </section>
  );
}
