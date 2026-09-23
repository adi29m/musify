import { getTrending } from "@/lib/audius";
import { GenreClient } from "./GenreClient";

export const revalidate = 600;

export default async function GenrePage(props: PageProps<"/genre/[genre]">) {
  const { genre } = await props.params;
  const name = decodeURIComponent(genre);
  const tracks = await getTrending(40, name).catch(() => []);

  return (
    <div>
      <div className="mb-6 rounded-lg bg-gradient-to-br from-green-700 to-zinc-900 p-8">
        <p className="text-sm text-zinc-300">Genre</p>
        <h1 className="text-4xl font-black sm:text-6xl">{name}</h1>
        <p className="mt-2 text-sm text-zinc-300">{tracks.length} trending tracks • every artist in this genre</p>
      </div>
      <GenreClient tracks={tracks} genre={name} />
    </div>
  );
}
