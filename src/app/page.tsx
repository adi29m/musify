import { Suspense } from "react";
import Link from "next/link";
import { MicVocal } from "lucide-react";
import { getTrending, getTrendingPlaylists, GENRES, playlistArt } from "@/lib/audius";
import { getPopularMusic } from "@/lib/youtube";
import { Section, GenreGrid } from "@/components/Section";
import { TrackShelf } from "@/components/TrackShelf";
import { QuickGrid } from "@/components/QuickGrid";

export const revalidate = 600;

type Filter = "all" | "music" | "podcasts";

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

function QuickSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-2 lg:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-md bg-zinc-800 sm:h-20" />
      ))}
    </div>
  );
}

function Pills({ active }: { active: Filter }) {
  const pill = (key: Filter, label: string) => (
    <Link
      key={key}
      href={key === "all" ? "/" : `/?filter=${key}`}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active === key ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="mb-4 flex gap-2">
      {pill("all", "All")}
      {pill("music", "Music")}
      {pill("podcasts", "Podcasts")}
    </div>
  );
}

async function QuickSection() {
  const [trending, popular] = await Promise.all([
    getTrending(20).catch(() => []),
    getPopularMusic(12).catch(() => []),
  ]);
  return <QuickGrid audius={trending} popular={popular} />;
}

async function PopularSection() {
  const popular = await getPopularMusic(12).catch(() => []);
  if (popular.length === 0) return null;
  return (
    <Section title="Popular right now" href="/search">
      <TrackShelf tracks={popular} emptyText="No popular tracks right now." />
    </Section>
  );
}

async function TrendingSection() {
  const trending = await getTrending(24).catch(() => []);
  return (
    <Section title="Trending now" href="/search">
      <TrackShelf tracks={trending} emptyText="Could not load trending right now." />
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

function PodcastsEmpty() {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 rounded-lg bg-[#181818] px-6 py-12 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-white/10">
        <MicVocal size={28} className="text-zinc-300" />
      </span>
      <h2 className="text-xl font-bold text-white">No podcasts here yet</h2>
      <p className="max-w-md text-sm text-zinc-400">
        Our open catalogs (Audius + YouTube music search) don&apos;t carry podcasts,
        so there&apos;s nothing to show under this filter. The music shelves are one click away.
      </p>
      <Link href="/" className="rounded-full bg-white px-6 py-2 text-sm font-bold text-black hover:scale-105">
        Back to music
      </Link>
    </div>
  );
}

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const raw = typeof sp?.filter === "string" ? sp.filter : "all";
  const filter: Filter = raw === "music" || raw === "podcasts" ? raw : "all";
  const genres = [...GENRES];

  return (
    <div>
      <Pills active={filter} />

      <Suspense fallback={<QuickSkeleton />}>
        <QuickSection />
      </Suspense>

      {filter === "podcasts" ? (
        <PodcastsEmpty />
      ) : (
        <>
          <Suspense fallback={<TrendingSkeleton />}>
            <PopularSection />
          </Suspense>

          <Suspense fallback={<TrendingSkeleton />}>
            <TrendingSection />
          </Suspense>

          {filter === "all" && (
            <>
              <Suspense fallback={<PlaylistsSkeleton />}>
                <PlaylistsSection />
              </Suspense>

              <Section title="Browse every genre">
                <GenreGrid genres={genres} />
              </Section>
            </>
          )}
        </>
      )}

      <p className="pb-6 text-xs text-zinc-500">
        Musify plays the open Audius catalog plus full-length popular songs via the official YouTube player.
      </p>
    </div>
  );
}
