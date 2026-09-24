"use client";

import Link from "next/link";
import { usePlayer, useProgress } from "@/context/PlayerContext";
import { useLiked } from "@/context/LikedContext";
import { formatTime, type UiTrack } from "@/lib/audius";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Heart, PanelRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { AddToPlaylist } from "./AddToPlaylist";

export const TrackRow = memo(function TrackRow({ track, queue, index }: { track: UiTrack; queue: UiTrack[]; index: number }) {
  const { current, isPlaying, playTracks } = usePlayer();
  const active = current?.id === track.id;
  return (
    <div
      onClick={() => playTracks(queue, index)}
      className={`group grid cursor-pointer grid-cols-[3rem_1fr_auto] items-center gap-2 rounded-md px-2 py-2 hover:bg-white/10 sm:grid-cols-[2rem_3rem_1fr_auto] sm:gap-3 sm:px-3 ${active ? "bg-white/10" : ""}`}
    >
      <span className="hidden text-sm text-zinc-500 sm:block">{active && isPlaying ? "▶" : index + 1}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={track.artwork} alt="" className="hidden h-10 w-10 rounded object-cover sm:block" loading="lazy" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={track.artwork} alt="" className="h-12 w-12 rounded object-cover sm:hidden" loading="lazy" />
      <div className="min-w-0">
        <p className={`truncate text-sm font-medium ${active ? "text-green-400" : "text-white"}`}>{track.title}</p>
        <p className="truncate text-xs text-zinc-400">
          {track.artistId ? (
            <Link href={`/artist/${track.artistId}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
              {track.artist}
            </Link>
          ) : (
            <span>{track.artist}</span>
          )}
          {" • "}{track.genre}
          {track.youtubeId ? (
            <span className="ml-1 rounded bg-red-600 px-1 py-px text-[10px] font-bold text-white">YouTube</span>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <LikeButton track={track} small />
        <span className="hidden text-xs text-zinc-500 min-[380px]:block">{formatTime(track.duration)}</span>
      </div>
    </div>
  );
});

export const TrackCard = memo(function TrackCard({ track, queue }: { track: UiTrack; queue: UiTrack[] }) {
  const { playTrack, current, isPlaying, toggle } = usePlayer();
  const active = current?.id === track.id;
  return (
    <div className="group w-40 shrink-0 rounded-lg bg-[#181818] p-3 transition hover:bg-[#282828] sm:w-48">
      <div className="relative mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={track.artwork} alt={track.title} className="aspect-square w-full rounded-md object-cover shadow-lg" loading="lazy" />
        <button
          onClick={() => (active ? toggle() : playTrack(track, queue))}
          className="absolute bottom-2 right-2 grid h-12 w-12 translate-y-0 place-items-center rounded-full bg-green-500 text-black opacity-100 shadow-xl transition md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          aria-label={active && isPlaying ? "Pause" : "Play"}
        >
          {active && isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
      <Link href={`/track/${track.id}`} className="block truncate text-sm font-semibold text-white hover:underline">
        {track.title}
      </Link>
      <Link href={track.artistId ? `/artist/${track.artistId}` : "#"} className="block truncate text-xs text-zinc-400 hover:underline">
        {track.artist}
      </Link>
      {track.youtubeId ? (
        <span className="mt-1 inline-block rounded bg-red-600 px-1 py-px text-[10px] font-bold text-white">YouTube • full song</span>
      ) : null}
    </div>
  );
});

export function LikeButton({ track, small }: { track: UiTrack; small?: boolean }) {
  const { isLiked, toggleLike } = useLiked();
  const liked = isLiked(track.id);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(track);
      }}
      aria-label="Like"
      className={`${small ? "p-1" : "rounded-full border border-zinc-600 p-2"} ${liked ? "text-green-500" : "text-zinc-400 hover:text-white"}`}
    >
      <Heart size={small ? 16 : 18} fill={liked ? "currentColor" : "none"} />
    </button>
  );
}

export function PlayerBar() {
  const p = usePlayer();
  const { progress, duration, seek } = useProgress();
  const { current } = p;
  const [expanded, setExpanded] = useState(false);

  // Lock background scroll + close on Escape while the mobile sheet is open.
  // Only touches external systems inside the effect; no synchronous setState.
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  if (!current) return null;

  const max = Math.max(duration, current?.duration || 0, 1);
  const repeatLabel = p.repeat === "off" ? "Repeat off" : p.repeat === "all" ? "Repeat all" : "Repeat one";

  return (
    <>
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-black px-2 py-2 sm:px-3">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:w-1/3 sm:gap-3">
          <button
            onClick={() => setExpanded(true)}
            className="shrink-0 rounded sm:hidden"
            aria-label="Open now playing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.artwork} alt="" className="h-12 w-12 rounded object-cover" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.artwork} alt="" className="hidden h-14 w-14 shrink-0 rounded object-cover sm:block" />
          <div
            className="min-w-0 cursor-pointer"
            onClick={() => setExpanded(true)}
            title="Open now playing"
          >
            <div className="block truncate text-sm font-medium text-white sm:hidden">
              {current.title}
            </div>
            <Link href={`/track/${current.id}`} onClick={(e) => e.stopPropagation()} className="hidden truncate text-sm font-medium text-white hover:underline sm:block">
              {current.title}
            </Link>
            
            <div className="block truncate text-xs text-zinc-400 sm:hidden">
              {current.artist}
            </div>
            <div className="hidden sm:block">
              {current.artistId ? (
                <Link href={`/artist/${current.artistId}`} onClick={(e) => e.stopPropagation()} className="block truncate text-xs text-zinc-400 hover:underline">
                  {current.artist}
                </Link>
              ) : (
                <span className="block truncate text-xs text-zinc-400">{current.artist}</span>
              )}
            </div>
          </div>
          <span className="hidden sm:block"><LikeButton track={current} small /></span>
          <button
            onClick={() => setExpanded(true)}
            className="ml-auto shrink-0 rounded-full p-2 text-zinc-400 hover:text-white sm:hidden"
            aria-label="Open now playing"
          >
            <ChevronUp size={20} />
          </button>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1 sm:flex-1">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={p.toggleShuffle} className={`hidden min-[430px]:block ${p.shuffle ? "text-green-500" : "text-zinc-400 hover:text-white"}`} aria-label="Shuffle">
              <Shuffle size={18} />
            </button>
            <button onClick={p.prev} className="text-zinc-300 hover:text-white" aria-label="Previous">
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button onClick={p.toggle} className="grid h-11 w-11 place-items-center rounded-full bg-white text-black hover:scale-105 sm:h-10 sm:w-10" aria-label="Play/Pause">
              {p.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={p.next} className="text-zinc-300 hover:text-white" aria-label="Next">
              <SkipForward size={20} fill="currentColor" />
            </button>
            <button onClick={p.cycleRepeat} className={`hidden min-[430px]:block ${p.repeat !== "off" ? "text-green-500" : "text-zinc-400 hover:text-white"}`} aria-label="Repeat">
              {p.repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
          <div className="hidden w-full max-w-xl items-center gap-2 text-[11px] text-zinc-400 sm:flex">
            <span>{formatTime(progress)}</span>
            <input
              type="range" min={0} max={max} step={1}
              value={Math.min(progress, max)}
              onChange={(e) => seek(Number(e.target.value))}
              className="h-1 w-full accent-green-500"
              aria-label="Seek"
            />
            <span>{formatTime(duration || current.duration)}</span>
          </div>
        </div>

        <div className="hidden w-1/3 items-center justify-end gap-2 sm:flex">
          <button
            onClick={() => p.setNpOpen(!p.npOpen)}
            className={`hidden xl:block ${p.npOpen ? "text-green-500" : "text-zinc-400 hover:text-white"}`}
            aria-label="Now playing view"
            title="Now playing view"
          >
            <PanelRight size={18} />
          </button>
          <button onClick={p.toggleMute} className="text-zinc-400 hover:text-white" aria-label="Mute">
            {p.muted || p.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range" min={0} max={1} step={0.01} value={p.muted ? 0 : p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            className="h-1 w-24 accent-green-500"
            aria-label="Volume"
          />
        </div>
      </div>
      {/* mobile progress */}
      <div className="h-1 w-full bg-zinc-800 sm:hidden">
        <div className="h-full bg-green-500" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
      </div>
    </footer>

    {/* Mobile full-screen now playing — shuffle + repeat live here */}
    {expanded && (
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#0a0a0a] px-5 pb-10 pt-4 text-white sm:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`Now playing: ${current.title} by ${current.artist}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setExpanded(false)}
            className="rounded-full p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label="Close now playing"
            autoFocus
          >
            <ChevronDown size={24} />
          </button>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Now playing</p>
          <Link
            href={`/track/${current.id}`}
            onClick={() => setExpanded(false)}
            className="rounded-full px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            Details
          </Link>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.artwork}
          alt={current.title}
          className="mx-auto aspect-square w-full max-w-sm rounded-lg object-cover shadow-2xl"
        />

        <div className="mx-auto mt-6 flex w-full max-w-sm items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-2xl font-extrabold">{current.title}</p>
            <p className="mt-1 truncate text-base text-zinc-400">{current.artist}</p>
          </div>
          <LikeButton track={current} />
        </div>

        <div className="mx-auto mt-4 w-full max-w-sm">
          <input
            type="range" min={0} max={max} step={1}
            value={Math.min(progress, max)}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1.5 w-full accent-white"
            aria-label="Seek"
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-400">
            <span>{formatTime(progress)}</span>
            <span>-{formatTime(Math.max((duration || current.duration || 0) - progress, 0))}</span>
          </div>
        </div>

        <div className="mx-auto mt-2 flex w-full max-w-sm items-center justify-between">
          <button
            onClick={p.toggleShuffle}
            className={p.shuffle ? "text-green-500" : "text-zinc-300 hover:text-white"}
            aria-label={p.shuffle ? "Shuffle on" : "Shuffle off"}
            aria-pressed={p.shuffle}
          >
            <Shuffle size={26} />
          </button>
          <button onClick={p.prev} className="text-white hover:scale-105" aria-label="Previous">
            <SkipBack size={32} fill="currentColor" />
          </button>
          <button
            onClick={p.toggle}
            className="grid h-16 w-16 place-items-center rounded-full bg-white text-black hover:scale-105"
            aria-label={p.isPlaying ? "Pause" : "Play"}
          >
            {p.isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={p.next} className="text-white hover:scale-105" aria-label="Next">
            <SkipForward size={32} fill="currentColor" />
          </button>
          <button
            onClick={p.cycleRepeat}
            className={p.repeat !== "off" ? "text-green-500" : "text-zinc-300 hover:text-white"}
            aria-label={repeatLabel}
          >
            {p.repeat === "one" ? <Repeat1 size={26} /> : <Repeat size={26} />}
          </button>
        </div>
        <p className="mt-1 text-center text-[11px] text-zinc-500" aria-live="polite">
          Shuffle {p.shuffle ? "on" : "off"} • {repeatLabel}
        </p>

        <div className="mx-auto mt-6 flex w-full max-w-sm items-center gap-2">
          <button onClick={p.toggleMute} className="shrink-0 text-zinc-300 hover:text-white" aria-label="Mute">
            {p.muted || p.volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range" min={0} max={1} step={0.01} value={p.muted ? 0 : p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            className="h-1 w-full accent-white"
            aria-label="Volume"
          />
        </div>

        <div className="mx-auto mt-6 w-full max-w-sm">
          <AddToPlaylist track={current} />
        </div>
      </div>
    )}
    </>
  );
}
