"use client";

import { useEffect, useState } from "react";
import type { UiTrack } from "@/lib/audius";

export function AddToPlaylist({ track }: { track: UiTrack }) {
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/playlists", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { playlists: [] }))
      .then((j) => setPlaylists(j.playlists ?? []))
      .catch(() => {});
  }, [open]);

  async function add(id: string) {
    setMsg("");
    const r = await fetch(`/api/playlists/${id}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackId: track.id, title: track.title, artist: track.artist,
        artwork: track.artwork, genre: track.genre, duration: track.duration,
      }),
    });
    if (r.ok) {
      setMsg("Added!");
      setTimeout(() => setOpen(false), 800);
    } else if (r.status === 401) {
      window.location.href = "/login";
    } else {
      setMsg("Failed to add");
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-white hover:border-white">
        + Add to playlist
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-56 rounded-md bg-[#282828] p-2 shadow-xl">
          {playlists.length === 0 && <p className="px-2 py-1 text-xs text-zinc-400">No playlists yet — create one in Library.</p>}
          {playlists.map((p) => (
            <button key={p.id} onClick={() => add(p.id)} className="block w-full rounded px-2 py-1.5 text-left text-sm text-white hover:bg-zinc-700">
              {p.name}
            </button>
          ))}
          {msg && <p className="px-2 py-1 text-xs text-green-400">{msg}</p>}
        </div>
      )}
    </div>
  );
}
