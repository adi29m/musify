import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrack, formatTime, formatPlays } from "@/lib/audius";
import { getYouTubeTrack } from "@/lib/youtube";
import { TrackClient } from "./TrackClient";

export const revalidate = 600;

export default async function TrackPage(props: PageProps<"/track/[id]">) {
  const { id } = await props.params;
  const track = id.startsWith("yt_")
    ? await getYouTubeTrack(id.slice(3)).catch(() => null)
    : await getTrack(id).catch(() => null);
  if (!track) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 p-4 sm:flex-row sm:items-end sm:gap-6 sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={track.artwork} alt={track.title} className="h-40 w-40 rounded-lg object-cover shadow-2xl sm:h-52 sm:w-52" />
        <div className="min-w-0">
          <p className="text-sm text-zinc-300">Song • {track.genre}</p>
          <h1 className="text-3xl font-black sm:text-5xl">{track.title}</h1>
          <p className="mt-2 text-sm text-zinc-300">
            {track.artistId ? (
              <Link href={`/artist/${track.artistId}`} className="font-bold text-white hover:underline">{track.artist}</Link>
            ) : (
              <span className="font-bold text-white">{track.artist}</span>
            )}
            {" • "}{formatPlays(track.plays)} plays • {formatTime(track.duration)}
          </p>
        </div>
      </div>
      <TrackClient track={track} />
    </div>
  );
}
