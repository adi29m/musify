"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home, Search, Plus, Heart, ListMusic, ArrowDownWideNarrow, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";

type Pl = { id: string; name: string; _count?: { tracks: number } };
type Artist = { id: string; name: string; image: string };
type Chip = "all" | "playlists" | "artists";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const { isPlaying } = usePlayer();
  const [playlists, setPlaylists] = useState<Pl[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [chip, setChip] = useState<Chip>("all");
  const [filter, setFilter] = useState("");
  const [sortAZ, setSortAZ] = useState(false);
  const activePlaylist = sp.get("playlist");

  useEffect(() => {
    fetch("/api/playlists", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { playlists: [] }))
      .then((j) => setPlaylists(j.playlists ?? []))
      .catch(() => {});
    fetch("/api/discover/artists", { next: { revalidate: 600 } } as RequestInit)
      .then((r) => (r.ok ? r.json() : { artists: [] }))
      .then((j) => setArtists(j.artists ?? []))
      .catch(() => {});
  }, [pathname]);

  async function create() {
    const r = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `My Playlist #${playlists.length + 1}` }),
    });
    if (r.status === 401) {
      router.push("/login");
      return;
    }
    const j = await r.json().catch(() => null);
    if (j?.playlist) {
      setPlaylists((p) => [{ ...j.playlist, _count: { tracks: 0 } }, ...p]);
      router.push(`/library?playlist=${j.playlist.id}`);
    }
  }

  const q = filter.trim().toLowerCase();
  const shownPlaylists = useMemo(() => {
    let list = q ? playlists.filter((p) => p.name.toLowerCase().includes(q)) : playlists;
    if (sortAZ) list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [playlists, q, sortAZ]);
  const shownArtists = useMemo(
    () => (q ? artists.filter((a) => a.name.toLowerCase().includes(q)) : artists),
    [artists, q]
  );
  const showPlaylists = chip !== "artists";
  const showArtists = chip !== "playlists";

  const nav = (href: string, active: boolean) =>
    `flex items-center gap-4 rounded-md px-3 py-2 text-base font-bold transition ${
      active ? "text-white" : "text-zinc-400 hover:text-white"
    }`;

  const chipCls = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
      on ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
    }`;

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col gap-2 p-2 md:flex">
      {/* nav box */}
      <div className="rounded-lg bg-[#121212] px-3 py-4">
        <nav className="space-y-2">
          <Link href="/" className={nav("/", pathname === "/")}>
            <Home size={24} /> Home
          </Link>
          <Link href="/search" className={nav("/search", pathname?.startsWith("/search") ?? false)}>
            <Search size={24} /> Search
          </Link>
        </nav>
      </div>

      {/* library box */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-[#121212]">
        <div className="flex items-center justify-between px-4 pb-1 pt-4">
          <span className="text-base font-bold text-zinc-400">Your Library</span>
          <div className="flex items-center gap-1">
            <button onClick={create} className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold text-zinc-300 hover:bg-white/10 hover:text-white" title="Create playlist">
              <Plus size={18} /> Create
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-4 py-2">
          <button onClick={() => setChip(chip === "playlists" ? "all" : "playlists")} className={chipCls(chip === "playlists")}>Playlists</button>
          <button onClick={() => setChip(chip === "artists" ? "all" : "artists")} className={chipCls(chip === "artists")}>Artists</button>
        </div>

        <div className="flex items-center justify-between px-4 py-1">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search in library"
            data-gramm="false"
            data-gramm_editor="false"
            className="w-36 rounded-full bg-white/10 px-3 py-1 text-[13px] text-white outline-none placeholder:text-zinc-500 focus:bg-white/15"
          />
          <button
            onClick={() => setSortAZ((s) => !s)}
            title={sortAZ ? "Sorted A–Z (click for recents)" : "Recents (click for A–Z)"}
            className="flex items-center gap-1 text-[13px] text-zinc-400 hover:text-white"
          >
            {sortAZ ? "A–Z" : "Recents"} <ArrowDownWideNarrow size={15} />
          </button>
        </div>

        <div className="mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
          {showPlaylists && (!q || "liked songs".includes(q)) && (
            <Link href="/library?tab=liked" className="flex items-center gap-3 rounded-md p-2 hover:bg-white/10">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded bg-gradient-to-br from-indigo-500 to-violet-300">
                <Heart size={20} className="text-white" fill="currentColor" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] text-white">Liked Songs</span>
                <span className="block truncate text-[13px] text-zinc-500">Playlist • Musify</span>
              </span>
            </Link>
          )}

          {showPlaylists && shownPlaylists.map((p) => (
            <Link key={p.id} href={`/library?playlist=${p.id}`} className={`flex items-center gap-3 rounded-md p-2 hover:bg-white/10 ${activePlaylist === p.id ? "bg-white/10" : ""}`}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded bg-zinc-800">
                <ListMusic size={20} className="text-zinc-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[15px] ${activePlaylist === p.id ? "text-green-400" : "text-white"}`}>{p.name}</span>
                <span className="block truncate text-[13px] text-zinc-500">Playlist • {p._count?.tracks ?? 0} songs</span>
              </span>
              {activePlaylist === p.id && isPlaying && <Volume2 size={16} className="shrink-0 text-green-400" />}
            </Link>
          ))}

          {showArtists && shownArtists.map((a) => (
            <Link key={a.id} href={`/artist/${a.id}`} className="flex items-center gap-3 rounded-md p-2 hover:bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover" />
              <span className="min-w-0">
                <span className="block truncate text-[15px] text-white">{a.name}</span>
                <span className="block truncate text-[13px] text-zinc-500">Artist</span>
              </span>
            </Link>
          ))}

          {showPlaylists && shownPlaylists.length === 0 && (
            <p className="px-2 py-2 text-xs text-zinc-500">
              {playlists.length === 0 ? "Login and press Create for your first playlist." : "No playlists match."}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
