import { notFound } from "next/navigation";
import { getArtist, getArtistTracks, artistArt } from "@/lib/audius";
import { ArtistClient } from "./ArtistClient";

export const revalidate = 600;

export default async function ArtistPage(props: PageProps<"/artist/[id]">) {
  const { id } = await props.params;
  const [artist, tracks] = await Promise.all([
    getArtist(id).catch(() => null),
    getArtistTracks(id).catch(() => []),
  ]);
  if (!artist) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-900 p-4 sm:flex-row sm:items-end sm:gap-6 sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artistArt(artist)} alt={artist.name} className="h-40 w-40 rounded-full object-cover shadow-2xl sm:h-52 sm:w-52" />
        <div className="min-w-0">
          <p className="text-sm text-zinc-300">Artist / Band • {artist.track_count ?? tracks.length} tracks</p>
          <h1 className="break-words text-3xl font-black sm:text-6xl">{artist.name}</h1>
          <p className="mt-2 text-sm text-zinc-300">@{artist.handle} • {(artist.follower_count ?? 0).toLocaleString()} followers</p>
          {artist.bio && <p className="mt-2 max-w-2xl text-sm text-zinc-400">{artist.bio.slice(0, 300)}</p>}
        </div>
      </div>
      <ArtistClient tracks={tracks} />
    </div>
  );
}
