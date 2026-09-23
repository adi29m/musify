import { NextResponse } from "next/server";
import { getTrending } from "@/lib/audius";

// Top artists derived from trending tracks (cached). Feeds the library panel.
export async function GET() {
  try {
    const tracks = await getTrending(50);
    const seen = new Map<string, { id: string; name: string; image: string }>();
    for (const t of tracks) {
      if (!t.artistId || seen.has(t.artistId)) continue;
      seen.set(t.artistId, { id: t.artistId, name: t.artist, image: t.artwork });
      if (seen.size >= 10) break;
    }
    return NextResponse.json({ artists: [...seen.values()] });
  } catch {
    return NextResponse.json({ artists: [] });
  }
}
