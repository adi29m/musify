"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { UiTrack } from "@/lib/audius";

type RepeatMode = "off" | "all" | "one";

type PlayerCtx = {
  queue: UiTrack[];
  index: number;
  current: UiTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  playTracks: (tracks: UiTrack[], startIndex?: number) => void;
  playTrack: (t: UiTrack, queue?: UiTrack[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<UiTrack[]>([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;

  const current = index >= 0 && index < queue.length ? queue[index] : null;
  const currentIdRef = useRef<string | null>(null);

  const advance = useCallback((auto: boolean) => {
    const r = repeatRef.current;
    const s = shuffleRef.current;
    if (r === "one" && auto) {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
      return;
    }
    setQueue((q) => {
      if (q.length === 0) return q;
      setIndex((i) => {
        if (s && q.length > 1) {
          let n = i;
          while (n === i) n = Math.floor(Math.random() * q.length);
          return n;
        }
        if (i < q.length - 1) return i + 1;
        if (r === "all") return 0;
        return i;
      });
      return q;
    });
  }, []);

  useEffect(() => {
    const a = new Audio();
    a.preload = "metadata";
    a.volume = 0.8;
    audioRef.current = a;

    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => advance(true);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, [advance]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (currentIdRef.current !== current.id) {
      currentIdRef.current = current.id;
      a.src = current.streamUrl;
      setProgress(0);
      setDuration(current.duration || 0);
    }
    a.play().catch(() => setIsPlaying(false));
  }, [current]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: current.genre,
        artwork: [{ src: current.artwork, sizes: "512x512", type: "image/jpeg" }],
      });
    } catch {
      /* noop */
    }
  }, [current]);

  const playTracks = useCallback((tracks: UiTrack[], startIndex = 0) => {
    if (tracks.length === 0) return;
    setQueue(tracks);
    setIndex(Math.min(Math.max(startIndex, 0), tracks.length - 1));
  }, []);

  const playTrack = useCallback(
    (t: UiTrack, q?: UiTrack[]) => {
      if (q && q.length) {
        const idx = q.findIndex((x) => x.id === t.id);
        playTracks(q, idx >= 0 ? idx : 0);
      } else {
        setQueue((prev) => {
          const exists = prev.findIndex((x) => x.id === t.id);
          if (exists >= 0) {
            setIndex(exists);
            return prev;
          }
          setIndex(prev.length);
          return [...prev, t];
        });
      }
    },
    [playTracks]
  );

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [current]);

  const next = useCallback(() => advance(false), [advance]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const seek = useCallback((sec: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = sec;
    setProgress(sec);
  }, []);

  const setVolume = useCallback((v: number) => {
    const a = audioRef.current;
    const nv = Math.min(1, Math.max(0, v));
    setVolumeState(nv);
    if (a) {
      a.volume = nv;
      a.muted = false;
    }
    setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setMuted((m) => {
      a.muted = !m;
      return !m;
    });
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    []
  );

  const value = useMemo<PlayerCtx>(
    () => ({
      queue, index, current, isPlaying, progress, duration, volume, muted,
      shuffle, repeat, playTracks, playTrack, toggle, next, prev, seek,
      setVolume, toggleMute, toggleShuffle, cycleRepeat,
    }),
    [queue, index, current, isPlaying, progress, duration, volume, muted, shuffle, repeat, playTracks, playTrack, toggle, next, prev, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer(): PlayerCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer must be used within PlayerProvider");
  return c;
}
