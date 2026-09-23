import { notFound } from "next/navigation";
import { getPlaylist, playlistArt } from "@/lib/audius";
import { PlaylistClient } from "./PlaylistClient";

export const revalidate = 600;

export default async function PlaylistPage(props: PageProps<"/playlist/[id]">) {
  const { id } = await props.params;
  const data = await getPlaylist(id).catch(() => null);
  if (!data) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 p-4 sm:flex-row sm:items-end sm:gap-6 sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={playlistArt(data.meta)} alt={data.meta.playlist_name} className="h-40 w-40 rounded-lg object-cover shadow-2xl sm:h-52 sm:w-52" />
        <div className="min-w-0">
          <p className="text-sm text-zinc-300">Playlist • by {data.meta.user?.name}</p>
          <h1 className="break-words text-3xl font-black sm:text-5xl">{data.meta.playlist_name}</h1>
          {data.meta.description && <p className="mt-2 max-w-2xl text-sm text-zinc-400">{data.meta.description.slice(0, 300)}</p>}
        </div>
      </div>
      <PlaylistClient tracks={data.tracks} />
    </div>
  );
}
