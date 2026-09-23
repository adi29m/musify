"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Plus, Heart } from "lucide-react";
import { useEffect, useState } from "react";

type Pl = { id: string; name: string; _count?: { tracks: number } };

export function Sidebar() {
  const pathname = usePathname();
  const [playlists, setPlaylists] = useState<Pl[]>([]);

  useEffect(() => {
    fetch("/api/playlists", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { playlists: [] }))
      .then((j) => setPlaylists(j.playlists ?? []))
      .catch(() => {});
  }, [pathname]);

  const link = (href: string, active: boolean) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
      active ? "text-white" : "text-zinc-400 hover:text-white"
    }`;

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-4 p-3 md:flex">
      <div className="rounded-lg bg-[#121212] p-3">
        <Link href="/" className="mb-2 flex items-center gap-2 px-3 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-green-500 text-lg font-black text-black">
            ♪
          </span>
          <span className="text-lg font-bold text-white">Musify</span>
        </Link>
        <nav className="mt-2 space-y-1">
          <Link href="/" className={link("/", pathname === "/")}>
            <Home size={20} /> Home
          </Link>
          <Link href="/search" className={link("/search", pathname?.startsWith("/search") ?? false)}>
            <Search size={20} /> Search
          </Link>
          <Link href="/library" className={link("/library", pathname?.startsWith("/library") ?? false)}>
            <Library size={20} /> Your Library
          </Link>
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-[#121212] p-3">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold text-zinc-400">Playlists</span>
          <Link href="/library" className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white" title="Create playlist">
            <Plus size={18} />
          </Link>
        </div>
        <div className="mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto">
          <Link href="/library?tab=liked" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
            <span className="grid h-10 w-10 place-items-center rounded bg-gradient-to-br from-indigo-500 to-violet-300">
              <Heart size={18} className="text-white" />
            </span>
            <span className="font-semibold">Liked Songs</span>
          </Link>
          {playlists.map((p) => (
            <Link key={p.id} href={`/library?playlist=${p.id}`} className="block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
              <span className="font-semibold text-white">{p.name}</span>
              <span className="block text-xs text-zinc-500">Playlist</span>
            </Link>
          ))}
          {playlists.length === 0 && (
            <p className="px-3 py-2 text-xs text-zinc-500">Login and create your first playlist.</p>
          )}
        </div>
        <p className="px-3 pt-3 text-[11px] leading-relaxed text-zinc-600">
          Free legal streaming via Audius. Full tracks, all genres & artists in the open catalog.
        </p>
      </div>
    </aside>
  );
}
