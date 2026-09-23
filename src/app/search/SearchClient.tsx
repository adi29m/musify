"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrackRow } from "@/components/Player";
import { searchTracks, type UiTrack } from "@/lib/audius";

export function SearchClient({ initialQuery, initialTracks }: { initialQuery: string; initialTracks: UiTrack[] }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [tracks, setTracks] = useState<UiTrack[]>(initialTracks);
  const [loading, setLoading] = useState(false);

  // keep in sync when server renders new query
  // (simple: update on prop change via key — parent remounts per query via URL, so fine)

  async function run(query: string) {
    const qq = query.trim();
    router.push(qq ? `/search?q=${encodeURIComponent(qq)}` : "/search");
    if (!qq) {
      setTracks([]);
      return;
    }
    setLoading(true);
    try {
      // client-side fetch via Audius directly for snappy UX
      const res = await fetch(
        `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(qq)}&limit=25&app_name=MusicAppClone`
      );
      const j = await res.json();
      const { toUiTrack } = await import("@/lib/audius");
      setTracks(((j.data ?? []) as Parameters<typeof toUiTrack>[0][]).map(toUiTrack));
    } catch {
      // keep server results
    } finally {
      setLoading(false);
    }
  }

  // fetch helper used above (kept tree-shaken)
  void searchTracks;

  return (
    <section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="mb-4 flex max-w-lg gap-2 md:hidden"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Songs, artists, bands…"
          data-gramm="false"
          data-gramm_editor="false"
          className="w-full rounded-full bg-[#242424] px-4 py-2 text-sm outline-none"
        />
        <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black">Go</button>
      </form>

      <h2 className="mb-3 text-xl font-bold">Songs</h2>
      {loading && <p className="text-sm text-zinc-500">Searching…</p>}
      {!loading && tracks.length === 0 && initialQuery && (
        <p className="text-sm text-zinc-500">No songs found for “{initialQuery}”. Try another singer, band or genre.</p>
      )}
      <div className="grid gap-1 lg:grid-cols-2">
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} queue={tracks} index={i} />
        ))}
      </div>
    </section>
  );
}
