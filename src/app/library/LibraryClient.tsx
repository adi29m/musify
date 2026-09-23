"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { Play, Trash2 } from "lucide-react";
import type { UiTrack } from "@/lib/audius";

type Like = { trackId: string; title: string; artist: string; artwork: string | null; genre: string | null; duration: number | null; source?: string | null; youtubeId?: string | null };
type PlTrack = { id: string; trackId: string; title: string; artist: string; artwork: string | null; duration: number | null; genre: string | null; source?: string | null; youtubeId?: string | null };
type Pl = { id: string; name: string; description: string | null; tracks: PlTrack[] };

function toUi(l: { trackId: string; title: string; artist: string; artwork?: string | null; duration?: number | null; genre?: string | null; source?: string | null; youtubeId?: string | null }): UiTrack {
  const yt = l.source === "youtube" || !!l.youtubeId;
  const youtubeId = l.youtubeId || (yt ? l.trackId.replace(/^yt_/, "") : undefined);
  return {
    id: l.trackId, title: l.title, artist: l.artist, artistId: "",
    artwork: l.artwork || "/placeholder-album.svg",
    duration: l.duration || 0, genre: l.genre || "Unknown", plays: 0,
    streamUrl: yt && youtubeId
      ? `https://www.youtube.com/watch?v=${youtubeId}`
      : `https://discoveryprovider.audius.co/v1/tracks/${l.trackId}/stream?app_name=MusicAppClone`,
    source: yt ? "youtube" : "audius",
    youtubeId,
  };
}

export function LibraryClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const { playTracks } = usePlayer();
  const tab = sp.get("tab") || "playlists";
  const activePlaylist = sp.get("playlist");

  const [me, setMe] = useState<{ name: string } | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [playlists, setPlaylists] = useState<Pl[]>([]);
  const [detail, setDetail] = useState<Pl | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((j) => {
      if (!j.user) router.push("/login");
      else setMe(j.user);
    });
    fetch("/api/likes").then((r) => (r.ok ? r.json() : { likes: [] })).then((j) => setLikes(j.likes ?? []));
    fetch("/api/playlists").then((r) => (r.ok ? r.json() : { playlists: [] })).then(async (j) => {
      const list = j.playlists ?? [];
      // hydrate each with tracks
      const full: Pl[] = [];
      for (const p of list) {
        const d = await fetch(`/api/playlists/${p.id}`).then((r) => r.json()).catch(() => null);
        if (d?.playlist) full.push(d.playlist);
        else full.push({ ...p, tracks: [] });
      }
      setPlaylists(full);
    });
  }, [router]);

  useEffect(() => {
    if (activePlaylist) {
      fetch(`/api/playlists/${activePlaylist}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => setDetail(j?.playlist ?? null));
    } else setDetail(null);
  }, [activePlaylist]);

  async function createPlaylist() {
    if (!newName.trim()) return;
    const r = await fetch("/api/playlists", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (r.ok) {
      setNewName("");
      const j = await r.json();
      setPlaylists((p) => [{ ...j.playlist, tracks: [] }, ...p]);
    }
  }

  async function removePlaylist(id: string) {
    await fetch(`/api/playlists/${id}`, { method: "DELETE" });
    setPlaylists((p) => p.filter((x) => x.id !== id));
    if (activePlaylist === id) router.push("/library");
  }

  async function removeTrack(playlistId: string, entryId: string) {
    await fetch(`/api/playlists/${playlistId}/tracks?entryId=${entryId}`, { method: "DELETE" });
    setPlaylists((ps) => ps.map((p) => p.id === playlistId ? { ...p, tracks: p.tracks.filter((t) => t.id !== entryId) } : p));
    setDetail((d) => d && d.id === playlistId ? { ...d, tracks: d.tracks.filter((t) => t.id !== entryId) } : d);
  }

  async function unlike(trackId: string) {
    await fetch(`/api/likes?trackId=${trackId}`, { method: "DELETE" });
    setLikes((l) => l.filter((x) => x.trackId !== trackId));
  }

  if (!me) return <p className="text-sm text-zinc-500">Loading your library…</p>;

  const likeTracks = likes.map(toUi);

  if (detail) {
    const dt = detail.tracks.map((t) => toUi({ trackId: t.trackId, title: t.title, artist: t.artist, artwork: t.artwork, duration: t.duration, genre: t.genre, source: t.source, youtubeId: t.youtubeId }));
    return (
      <div>
        <button onClick={() => router.push("/library")} className="mb-4 text-sm text-zinc-400 hover:text-white">← All playlists</button>
        <h1 className="text-3xl font-black">{detail.name}</h1>
        <p className="mb-4 text-sm text-zinc-400">{detail.tracks.length} songs</p>
        {dt.length > 0 && (
          <button onClick={() => playTracks(dt, 0)} className="mb-4 flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-black">
            <Play size={16} fill="currentColor" /> Play
          </button>
        )}
        <div className="space-y-1">
          {detail.tracks.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/10">
              <span className="w-6 text-sm text-zinc-500">{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.artwork || "/placeholder-album.svg"} alt="" className="h-10 w-10 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{t.title}</p>
                <p className="truncate text-xs text-zinc-500">{t.artist}</p>
              </div>
              <button onClick={() => playTracks(dt, i)} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black">Play</button>
              <button onClick={() => removeTrack(detail.id, t.id)} className="p-1 text-zinc-500 hover:text-red-400" aria-label="Remove">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {detail.tracks.length === 0 && <p className="text-sm text-zinc-500">Empty — add songs via any track’s “Add to playlist”.</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-black">Your Library</h1>
      <div className="mb-6 flex gap-2">
        <Link href="/library" className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === "playlists" && !activePlaylist ? "bg-white text-black" : "bg-zinc-800 text-white"}`}>Playlists</Link>
        <Link href="/library?tab=liked" className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === "liked" ? "bg-white text-black" : "bg-zinc-800 text-white"}`}>Liked ({likes.length})</Link>
      </div>

      {tab === "liked" ? (
        <div>
          {likeTracks.length > 0 && (
            <button onClick={() => playTracks(likeTracks, 0)} className="mb-4 flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-black">
              <Play size={16} fill="currentColor" /> Play liked
            </button>
          )}
          <div className="space-y-1">
            {likes.map((l, i) => (
              <div key={l.trackId} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/10">
                <span className="w-6 text-sm text-zinc-500">{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.artwork || "/placeholder-album.svg"} alt="" className="h-10 w-10 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{l.title}</p>
                  <p className="truncate text-xs text-zinc-500">{l.artist}</p>
                </div>
                <button onClick={() => playTracks(likeTracks, i)} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black">Play</button>
                <button onClick={() => unlike(l.trackId)} className="p-1 text-zinc-500 hover:text-red-400" aria-label="Unlike">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {likes.length === 0 && <p className="text-sm text-zinc-500">No liked songs yet — tap ♡ on any song.</p>}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 flex max-w-md gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New playlist name" className="w-full rounded-full bg-[#242424] px-4 py-2 text-sm outline-none" />
            <button onClick={createPlaylist} className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-black">Create</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((p) => (
              <div key={p.id} className="rounded-lg bg-[#181818] p-4 hover:bg-[#282828]">
                <Link href={`/library?playlist=${p.id}`} className="block">
                  <p className="truncate text-lg font-bold text-white">{p.name}</p>
                  <p className="text-sm text-zinc-500">{p.tracks.length} songs</p>
                </Link>
                <div className="mt-3 flex gap-2">
                  <Link href={`/library?playlist=${p.id}`} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black">Open</Link>
                  <button onClick={() => removePlaylist(p.id)} className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-white hover:bg-red-900">Delete</button>
                </div>
              </div>
            ))}
          </div>
          {playlists.length === 0 && <p className="mt-2 text-sm text-zinc-500">No playlists yet — create your first mix.</p>}
        </div>
      )}
    </div>
  );
}
