"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { LikeButton } from "./Player";
import { AddToPlaylist } from "./AddToPlaylist";
import { formatPlays, formatTime } from "@/lib/audius";

export function NowPlayingPanel() {
  const { current, npOpen, setNpOpen } = usePlayer();
  if (!current) return null;

  return (
    <aside
      className={`hidden shrink-0 overflow-hidden transition-all duration-300 ease-in-out xl:block ${
        npOpen ? "w-[340px] p-2 pl-0 opacity-100" : "w-0 p-0 opacity-0"
      }`}
    >
      <div className="flex h-full min-h-0 w-[324px] flex-col gap-4 overflow-y-auto rounded-lg bg-[#121212] p-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-zinc-300">Now playing</span>
          <button onClick={() => setNpOpen(false)} className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Close now playing">
            <X size={18} />
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.artwork} alt={current.title} className="aspect-square w-full rounded-lg object-cover shadow-2xl" />

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/track/${current.id}`} className="block truncate text-2xl font-extrabold text-white hover:underline">
              {current.title}
            </Link>
            <p className="truncate text-sm text-zinc-400">{current.artist}</p>
          </div>
          <LikeButton track={current} small />
        </div>

        <AddToPlaylist track={current} />

        <div className="rounded-lg bg-white/5 p-4">
          <p className="mb-2 text-sm font-bold text-white">About this track</p>
          <dl className="space-y-1 text-[13px]">
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Genre</dt>
              <dd className="truncate text-zinc-200">{current.genre}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Plays</dt>
              <dd className="text-zinc-200">{formatPlays(current.plays)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Duration</dt>
              <dd className="text-zinc-200">{formatTime(current.duration)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Source</dt>
              <dd>
                {current.youtubeId ? (
                  <span className="rounded bg-red-600 px-1.5 py-px text-[11px] font-bold text-white">YouTube</span>
                ) : (
                  <span className="rounded bg-zinc-700 px-1.5 py-px text-[11px] font-bold text-white">Audius</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </aside>
  );
}
