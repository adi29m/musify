"use client";

import { usePlayer } from "@/context/PlayerContext";
import { LikeButton } from "@/components/Player";
import { AddToPlaylist } from "@/components/AddToPlaylist";
import { Play, Pause } from "lucide-react";
import type { UiTrack } from "@/lib/audius";

export function TrackClient({ track }: { track: UiTrack }) {
  const { playTrack, current, isPlaying, toggle } = usePlayer();
  const active = current?.id === track.id;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => (active ? toggle() : playTrack(track, [track]))}
        className="flex items-center gap-2 rounded-full bg-green-500 px-8 py-3 text-sm font-bold text-black hover:scale-105"
      >
        {active && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        {active && isPlaying ? "Pause" : "Play"}
      </button>
      <LikeButton track={track} />
      <AddToPlaylist track={track} />
      <audio controls src={track.streamUrl} className="mt-2 w-full max-w-xl" preload="none" />
    </div>
  );
}
