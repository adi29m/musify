import { searchTracks, searchArtists, searchPlaylists, artistArt, playlistArt } from "@/lib/audius";
import { SearchClient } from "./SearchClient";
import Link from "next/link";

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const q = typeof sp?.q === "string" ? sp.q : "";

  if (!q) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-extrabold">Search</h1>
        <p className="text-sm text-zinc-400">Type above to search every singer, artist, band, song and playlist in the open catalog.</p>
        <SearchClient initialQuery="" initialTracks={[]} />
      </div>
    );
  }

  const [tracks, artists, playlists] = await Promise.all([
    searchTracks(q).catch(() => []),
    searchArtists(q).catch(() => []),
    searchPlaylists(q).catch(() => []),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Results for “{q}”</h1>

      {artists.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">Artists & bands</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {artists.map((a) => (
              <Link key={a.id} href={`/artist/${a.id}`} className="w-36 shrink-0 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artistArt(a)} alt={a.name} className="mx-auto mb-2 h-36 w-36 rounded-full object-cover" loading="lazy" />
                <p className="truncate text-sm font-semibold text-white">{a.name}</p>
                <p className="truncate text-xs text-zinc-500">Artist</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {playlists.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">Playlists</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {playlists.map((p) => (
              <Link key={p.id} href={`/playlist/${p.id}`} className="w-40 shrink-0 rounded-lg bg-[#181818] p-3 hover:bg-[#282828]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={playlistArt(p)} alt={p.playlist_name} className="mb-2 aspect-square w-full rounded object-cover" loading="lazy" />
                <p className="truncate text-sm font-semibold">{p.playlist_name}</p>
                <p className="truncate text-xs text-zinc-500">By {p.user?.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SearchClient initialQuery={q} initialTracks={tracks} />
    </div>
  );
}
