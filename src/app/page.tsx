import { getTrending, getTrendingPlaylists, GENRES, playlistArt } from "@/lib/audius";
import { Section, GenreGrid } from "@/components/Section";
import { HomeClient } from "./HomeClient";
import Link from "next/link";

export const revalidate = 600;

export default async function Home() {
  const [trending, playlists] = await Promise.all([
    getTrending(30).catch(() => []),
    getTrendingPlaylists(8).catch(() => []),
  ]);

  const genres = [...GENRES];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl">Good evening — what will you play?</h1>

      <Section title="Browse every genre">
        <GenreGrid genres={genres} />
      </Section>

      <Section title="Trending now — all artists & bands">
        <HomeClient tracks={trending} />
      </Section>

      {playlists.length > 0 && (
        <Section title="Trending playlists">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {playlists.map((p) => (
              <Link key={p.id} href={`/playlist/${p.id}`} className="w-40 shrink-0 rounded-lg bg-[#181818] p-3 hover:bg-[#282828] sm:w-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={playlistArt(p)} alt={p.playlist_name} className="mb-3 aspect-square w-full rounded-md object-cover" loading="lazy" />
                <p className="truncate text-sm font-semibold text-white">{p.playlist_name}</p>
                <p className="truncate text-xs text-zinc-400">By {p.user?.name}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <p className="pb-6 text-xs text-zinc-500">
        Musify streams the open Audius catalog — thousands of independent singers, artists and bands across {genres.length}+ genres,
        100% legal full-track playback. Mainstream major-label hits can&apos;t be bundled due to copyright; search the open catalog or
        use Library to save likes & playlists.
      </p>
    </div>
  );
}
