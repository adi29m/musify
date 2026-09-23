import { Suspense } from "react";
import { getTrending, getTrendingPlaylists, GENRES, playlistArt } from "@/lib/audius";
import { getPopularMusic } from "@/lib/youtube";
import { Section, GenreGrid } from "@/components/Section";
import { HomeClient } from "./HomeClient";
import Link from "next/link";

export const revalidate = 600;

function TrendingSkeleton() {
  return (
    <div>
      <div className="mb-4 h-11 w-44 animate-pulse rounded-full bg-zinc-800" />
      <div className="mb-6 flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-40 shrink-0 rounded-lg bg-[#181818] p-3 sm:w-48">
            <div className="mb-3 aspect-square w-full animate-pulse rounded-md bg-zinc-800" />
            <div className="mb-1 h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>
      <div className="grid gap-1 lg:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md px-3 py-2">
            <div className="h-10 w-10 animate-pulse rounded bg-zinc-800" />
            <div className="flex-1">
              <div className="mb-1 h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaylistsSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-40 shrink-0 rounded-lg bg-[#181818] p-3 sm:w-48">
          <div className="mb-3 aspect-square w-full animate-pulse rounded-md bg-zinc-800" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

async function TrendingSection() {
  const trending = await getTrending(30).catch(() => []);
  return (
    <Section title="Trending now — all artists & bands">
      <HomeClient tracks={trending} />
    </Section>
  );
}

async function PopularSection() {
  const popular = await getPopularMusic(12).catch(() => []);
  if (popular.length === 0) return null;
  return (
    <Section title="Popular right now — full songs">
      <HomeClient tracks={popular} />
    </Section>
  );
}

async function PlaylistsSection() {
  const playlists = await getTrendingPlaylists(8).catch(() => []);
  if (playlists.length === 0) return null;
  return (
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
  );
}

export default async function Home() {
  const genres = [...GENRES];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl">Good evening — what will you play?</h1>

      <Section title="Browse every genre">
        <GenreGrid genres={genres} />
      </Section>

      <Suspense fallback={<TrendingSkeleton />}>
        <PopularSection />
      </Suspense>

      <Suspense fallback={<TrendingSkeleton />}>
        <TrendingSection />
      </Suspense>

      <Suspense fallback={<PlaylistsSkeleton />}>
        <PlaylistsSection />
      </Suspense>

      <p className="pb-6 text-xs text-zinc-500">
        Musify plays the open Audius catalog (thousands of independent singers, artists and bands across {genres.length}+ genres)
        plus full-length popular songs via the official YouTube player. Search anything — indie tracks stream as audio,
        mainstream hits play through YouTube.
      </p>
    </div>
  );
}
