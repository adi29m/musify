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
      <div className="mb-6 flex flex-col gap-6 rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 p-6 sm:flex-row sm:items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={playlistArt(data.meta)} alt={data.meta.playlist_name} className="h-52 w-52 rounded-lg object-cover shadow-2xl" />
        <div>
          <p className="text-sm text-zinc-300">Playlist • by {data.meta.user?.name}</p>
          <h1 className="text-3xl font-black sm:text-5xl">{data.meta.playlist_name}</h1>
          {data.meta.description && <p className="mt-2 max-w-2xl text-sm text-zinc-400">{data.meta.description.slice(0, 300)}</p>}
        </div>
      </div>
      <PlaylistClient tracks={data.tracks} />
    </div>
  );
}
