"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isYouTube, type UiTrack } from "@/lib/audius";

type RepeatMode = "off" | "all" | "one";

type PlayerCtx = {
  queue: UiTrack[];
  index: number;
  current: UiTrack | null;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  playTracks: (tracks: UiTrack[], startIndex?: number) => void;
  playTrack: (t: UiTrack, queue?: UiTrack[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

// Updated ~4x/sec while audio plays. Kept in its own context so only the
// player bar (progress slider) re-renders — not every track row/card.
type ProgressCtx = {
  progress: number;
  duration: number;
  seek: (sec: number) => void;
};

const Ctx = createContext<PlayerCtx | null>(null);
const ProgressCx = createContext<ProgressCtx | null>(null);

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytHostRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const [ytReady, setYtReady] = useState(false);
  const pendingYtRef = useRef<string | null>(null);
  const engineRef = useRef<"audio" | "youtube" | null>(null);
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
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const current = index >= 0 && index < queue.length ? queue[index] : null;
  const currentIdRef = useRef<string | null>(null);

  const advance = useCallback((auto: boolean) => {
    const r = repeatRef.current;
    const s = shuffleRef.current;
    if (r === "one" && auto) {
      const a = audioRef.current;
      if (engineRef.current === "youtube") {
        try {
          ytPlayerRef.current?.seekTo(0, true);
          ytPlayerRef.current?.playVideo();
        } catch { /* noop */ }
      } else if (a) {
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

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // YouTube IFrame API is lazy-loaded on the first YouTube play — never on
  // page mount — so youtube.com is untouched unless the user plays a YT song.
  const ytApiPromiseRef = useRef<Promise<boolean> | null>(null);

  const loadYtApi = useCallback((): Promise<boolean> => {
    if (typeof window === "undefined") return Promise.resolve(false);
    if (window.YT?.Player) return Promise.resolve(true);
    if (ytApiPromiseRef.current) return ytApiPromiseRef.current;
    ytApiPromiseRef.current = new Promise((resolve) => {
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(ok);
      };
      const timer = setTimeout(() => finish(!!window.YT?.Player), 15000);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        finish(true);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onload = () => {
        // API calls onYouTubeIframeAPIReady shortly after load; poll as backup.
        setTimeout(() => finish(!!window.YT?.Player), 3000);
      };
      s.onerror = () => finish(false);
      document.head.appendChild(s);
    });
    return ytApiPromiseRef.current;
  }, []);

  const createYt = useCallback(() => {
    if (ytPlayerRef.current || !ytHostRef.current || !window.YT?.Player) return false;
    try {
      ytPlayerRef.current = new window.YT.Player(ytHostRef.current, {
        height: "2",
        width: "2",
        playerVars: { rel: 0, disablekb: 1 },
        events: {
          onReady: () => {
            setYtReady(true);
            try {
              ytPlayerRef.current?.setVolume(Math.round(volumeRef.current * 100));
              if (mutedRef.current) ytPlayerRef.current?.mute();
            } catch { /* noop */ }
            const pending = pendingYtRef.current;
            pendingYtRef.current = null;
            if (pending && engineRef.current === "youtube") {
              try {
                ytPlayerRef.current?.loadVideoById(pending);
              } catch { /* noop */ }
            }
          },
          onStateChange: (e: { data: number }) => {
            if (engineRef.current !== "youtube") return;
            if (e.data === 1) setIsPlaying(true); // PLAYING
            else if (e.data === 2) setIsPlaying(false); // PAUSED
            else if (e.data === 0) advanceRef.current(true); // ENDED
          },
          onError: (e: { data: number }) => {
            // Unplayable/unembeddable video (e.g. 101/150) — skip to next.
            if (engineRef.current !== "youtube") return;
            if ([5, 100, 101, 150].includes(e.data)) advanceRef.current(true);
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const ensureYtPlayer = useCallback(async (): Promise<boolean> => {
    if (ytPlayerRef.current?.loadVideoById) return true;
    const ok = await loadYtApi();
    if (!ok) return false;
    if (!ytPlayerRef.current) createYt();
    return !!ytPlayerRef.current;
  }, [loadYtApi, createYt]);

  // --- engines -----------------------------------------------------------
  useEffect(() => {
    const a = new Audio();
    a.preload = "metadata";
    a.volume = 0.8;
    audioRef.current = a;

    const onTime = () => {
      if (engineRef.current !== "youtube") setProgress(a.currentTime);
    };
    const onMeta = () => {
      if (engineRef.current !== "youtube") setDuration(a.duration || 0);
    };
    const onEnd = () => {
      if (engineRef.current !== "youtube") advanceRef.current(true);
    };
    const onPlay = () => {
      if (engineRef.current !== "youtube") setIsPlaying(true);
    };
    const onPause = () => {
      if (engineRef.current !== "youtube") setIsPlaying(false);
    };

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
  }, []);

  const playYoutubeId = useCallback((videoId: string) => {
    engineRef.current = "youtube";
    audioRef.current?.pause();
    setProgress(0);
    // Instant UI feedback; corrected below if the YT engine can't start.
    setIsPlaying(true);
    void ensureYtPlayer().then((ok) => {
      if (engineRef.current !== "youtube") return;
      if (!ok) {
        setIsPlaying(false);
        return;
      }
      try {
        if (ytPlayerRef.current?.loadVideoById) {
          ytPlayerRef.current.loadVideoById(videoId);
        } else {
          pendingYtRef.current = videoId;
        }
      } catch {
        pendingYtRef.current = videoId;
      }
    });
  }, [ensureYtPlayer]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (currentIdRef.current === current.id) return;
    currentIdRef.current = current.id;
    if (isYouTube(current) && current.youtubeId) {
      setDuration(current.duration || 0);
      playYoutubeId(current.youtubeId);
      return;
    }
    engineRef.current = "audio";
    try {
      ytPlayerRef.current?.pauseVideo();
    } catch { /* noop */ }
    if (a.src !== current.streamUrl) {
      a.src = current.streamUrl;
      setProgress(0);
      setDuration(current.duration || 0);
    }
    a.play().catch(() => setIsPlaying(false));
  }, [current, playYoutubeId]);

  // YouTube progress polling (audio engine uses timeupdate events instead)
  useEffect(() => {
    if (!current || !isYouTube(current)) return;
    const t = setInterval(() => {
      try {
        const yt = ytPlayerRef.current;
        if (!yt?.getCurrentTime || engineRef.current !== "youtube") return;
        const pos = yt.getCurrentTime();
        const dur = yt.getDuration?.() || 0;
        if (typeof pos === "number" && !isNaN(pos)) setProgress(pos);
        if (typeof dur === "number" && dur > 0) setDuration(dur);
      } catch { /* noop */ }
    }, 500);
    return () => clearInterval(t);
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
    if (engineRef.current === "youtube") {
      try {
        const yt = ytPlayerRef.current;
        const state = yt?.getPlayerState?.();
        if (state === 1) yt.pauseVideo();
        else yt?.playVideo();
      } catch { /* noop */ }
      return;
    }
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [current]);

  const next = useCallback(() => advance(false), [advance]);

  const prev = useCallback(() => {
    if (engineRef.current === "youtube") {
      try {
        const pos = ytPlayerRef.current?.getCurrentTime?.() || 0;
        if (pos > 3) {
          ytPlayerRef.current?.seekTo(0, true);
          return;
        }
      } catch { /* noop */ }
    } else {
      const a = audioRef.current;
      if (a && a.currentTime > 3) {
        a.currentTime = 0;
        return;
      }
    }
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const seek = useCallback((sec: number) => {
    if (engineRef.current === "youtube") {
      try {
        ytPlayerRef.current?.seekTo(sec, true);
      } catch { /* noop */ }
      setProgress(sec);
      return;
    }
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
    try {
      ytPlayerRef.current?.setVolume(Math.round(nv * 100));
      ytPlayerRef.current?.unMute();
    } catch { /* noop */ }
    setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const nm = !m;
      const a = audioRef.current;
      if (a) a.muted = nm;
      try {
        if (nm) ytPlayerRef.current?.mute();
        else ytPlayerRef.current?.unMute();
      } catch { /* noop */ }
      return nm;
    });
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    []
  );

  const value = useMemo<PlayerCtx>(
    () => ({
      queue, index, current, isPlaying, volume, muted,
      shuffle, repeat, playTracks, playTrack, toggle, next, prev,
      setVolume, toggleMute, toggleShuffle, cycleRepeat,
    }),
    [queue, index, current, isPlaying, volume, muted, shuffle, repeat, playTracks, playTrack, toggle, next, prev, setVolume, toggleMute, toggleShuffle, cycleRepeat]
  );

  const progressValue = useMemo<ProgressCtx>(
    () => ({ progress, duration, seek }),
    [progress, duration, seek]
  );

  void ytReady;

  return (
    <Ctx.Provider value={value}>
      <ProgressCx.Provider value={progressValue}>
        {/* Hidden official YouTube player for full-length popular songs */}
        <div ref={ytHostRef} aria-hidden style={{ position: "fixed", left: -9999, top: 0, width: 2, height: 2 }} />
        {children}
      </ProgressCx.Provider>
    </Ctx.Provider>
  );
}

export function usePlayer(): PlayerCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer must be used within PlayerProvider");
  return c;
}

export function useProgress(): ProgressCtx {
  const c = useContext(ProgressCx);
  if (!c) throw new Error("useProgress must be used within PlayerProvider");
  return c;
}
